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

        // GET /Invite/{token}
        [HttpGet("{token}")]
        public async Task<IActionResult> Index(string token)
        {
            if (string.IsNullOrWhiteSpace(token)) return NotFound();

            // Загружаем гостя по токену
            var guest = await _uow.Guests.GetAllAsync() // замените на метод поиска по токену, если есть
                .ContinueWith(t => t.Result.FirstOrDefault(g => g.InviteToken == token));

            if (guest == null) return NotFound();

            // Загружаем вопросы с опциями
            var questions = (await _uow.SurveyQuestions.GetAllWithOptionsAsync())
                .OrderBy(q => q.Id)
                .ToList();

            // Фильтрация по OutOfTowners: показываем такие вопросы только если город == "Бобруйск"
            bool includeOutOfTowners = string.Equals(guest.City?.Trim(), "Бобруйск", System.StringComparison.OrdinalIgnoreCase);

            var filtered = questions
                .Where(q => !q.OutOfTowners || includeOutOfTowners)
                .ToList();

            var vm = new InvitePageVm
            {
                InviteToken = token,
                GuestId = guest.Id,
                GuestName = guest.Name,
                GuestCity = guest.City,
                IsConfirmed = guest.Confirmation,
                IsCouple = guest.CoupleOrNot
            };

            foreach (var q in filtered)
            {
                // Если ForCouple и гость — пара, добавляем два экземпляра (InstanceIndex 1 и 2)
                int instances = (q.ForCouple && guest.CoupleOrNot) ? 2 : 1;
                for (int i = 1; i <= instances; i++)
                {
                    vm.Questions.Add(new InviteQuestionVm
                    {
                        QuestionId = q.Id,
                        Text = q.Text + (instances == 2 ? (i == 1 ? " (партнёр 1)" : " (партнёр 2)") : ""),
                        IsMultipleChoice = q.IsMultipleChoice,
                        AllowCustomAnswer = q.AllowCustomAnswer,
                        InstanceIndex = i,
                        Options = q.Options.Select(o => new OptionVm { Id = o.Id, Text = o.Text }).ToList()
                    });
                }
            }

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
