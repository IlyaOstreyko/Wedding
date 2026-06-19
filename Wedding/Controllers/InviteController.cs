using Microsoft.AspNetCore.Mvc;
using Wedding.DTO;
using Wedding.Models;
using Wedding.UnitOfWork;
using Wedding.ViewModel;

namespace Wedding.Controllers
{
    [Route("Invite")]
    public class InviteController : Controller
    {
        private readonly IUnitOfWork _uow;

        public InviteController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        [HttpGet("{token}")]
        public async Task<IActionResult> Index(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return NotFound();

            var guest = (await _uow.Guests.GetAllAsync())
                .FirstOrDefault(g => g.InviteToken == token);

            if (guest == null)
                return NotFound();

            var guestAnswers = (await _uow.SurveyAnswers.GetAllAsync())
    .Where(x => x.GuestId == guest.Id)
    .ToList();

            var questions = (await _uow.SurveyQuestions.GetAllWithOptionsAsync())
                .OrderBy(q => q.Id)
                .ToList();

            bool isBobruiskGuest =
                string.Equals(guest.City?.Trim(), "Бобруйск", StringComparison.OrdinalIgnoreCase);

            var filteredQuestions = questions
                .Where(q => !(isBobruiskGuest && q.OutOfTowners))
                .ToList();

            // МАППИНГ в ViewModel
            var vm = new InvitePageVm
            {
                InviteToken = token,
                GuestId = guest.Id,
                GuestName = guest.Name,
                GuestCity = guest.City,
                Gender = guest.Gender,
                IsConfirmed = guest.Confirmation,
                IsCouple = guest.CoupleOrNot,

                Questions = filteredQuestions.Select(q =>
                {
                    var questionAnswers = guestAnswers
                        .Where(a => a.QuestionId == q.Id)
                        .ToList();

                    return new InviteQuestionVm
                    {
                        QuestionId = q.Id,
                        Text = q.Text,
                        IsMultipleChoice = q.IsMultipleChoice,
                        AllowCustomAnswer = q.AllowCustomAnswer,

                        CustomAnswer = questionAnswers
                            .FirstOrDefault(a => !string.IsNullOrWhiteSpace(a.CustomAnswer))
                            ?.CustomAnswer,

                        Options = q.Options.Select(o => new OptionVm
                        {
                            Id = o.Id,
                            Text = o.Text,

                            IsSelected = questionAnswers
                                .Any(a => a.SelectedOptionId == o.Id)

                        }).ToList()
                    };
                }).ToList()
            };

            return View(vm);
        }

        [HttpPost("ToggleAttendance")]
        public async Task<IActionResult> ToggleAttendance(
    [FromBody] ToggleAttendanceDto dto)
        {
            if (dto == null ||
                string.IsNullOrWhiteSpace(dto.InviteToken))
            {
                return BadRequest();
            }

            var guest = (await _uow.Guests.GetAllAsync())
                .FirstOrDefault(x => x.InviteToken == dto.InviteToken);

            if (guest == null)
            {
                return NotFound();
            }

            guest.Confirmation = dto.IsConfirmed;

            _uow.Guests.Update(guest);

            await _uow.SaveAsync();

            return Ok(new
            {
                success = true
            });
        }

        // POST /Invite/Submit
        [HttpPost("Submit")]
        public async Task<IActionResult> Submit([FromBody] SubmitAnswerDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.InviteToken))
                return BadRequest("Invalid payload");

            // Найти гостя по токену
            var guest = (await _uow.Guests.GetAllAsync()).FirstOrDefault(g => g.InviteToken == dto.InviteToken);
            if (guest == null) return NotFound("Guest not found");

            // Удаляем старые ответы гостя (если нужно перезаписать)
            var existingAnswers = (await _uow.SurveyAnswers.GetAllAsync()).Where(a => a.GuestId == guest.Id).ToList();
            if (existingAnswers.Any())
            {
                foreach (var ea in existingAnswers) _uow.SurveyAnswers.Remove(ea);
            }

            // Сохраняем новые ответы
            foreach (var a in dto.Answers)
            {
                // Если есть выбранные опции — для каждой создаём запись (поддержка множественного выбора)
                if (a.SelectedOptionIds != null && a.SelectedOptionIds.Count > 0)
                {
                    foreach (var optId in a.SelectedOptionIds)
                    {
                        var ans = new SurveyAnswer
                        {
                            GuestId = guest.Id,
                            QuestionId = a.QuestionId,
                            SelectedOptionId = optId,
                            CustomAnswer = null
                        };
                        await _uow.SurveyAnswers.AddAsync(ans);
                    }
                }
                // Если есть произвольный ответ — создаём запись с CustomAnswer
                if (!string.IsNullOrWhiteSpace(a.CustomAnswer))
                {
                    var ans = new SurveyAnswer
                    {
                        GuestId = guest.Id,
                        QuestionId = a.QuestionId,
                        SelectedOptionId = null,
                        CustomAnswer = a.CustomAnswer.Trim()
                    };
                    await _uow.SurveyAnswers.AddAsync(ans);
                }
            }
            _uow.Guests.Update(guest);

            await _uow.SaveAsync();

            return Ok(new { success = true });
        }
    }
}
