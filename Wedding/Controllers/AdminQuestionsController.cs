using Microsoft.AspNetCore.Mvc;
using Wedding.DTO;
using Wedding.Models;
using Wedding.Security;
using Wedding.UnitOfWork;

namespace Wedding.Controllers
{
    [Route("AdminQuestions")]
    public class AdminQuestionsController : Controller
    {
        private readonly IUnitOfWork _uow;

        public AdminQuestionsController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<IActionResult> Index()
        {
            if (!AdminAuthHelper.IsAuthorized(HttpContext))
                return RedirectToAction("Locked");

            return View();
        }

        [HttpGet("Locked")]
        public IActionResult Locked()
        {
            return View("~/Views/Shared/Locked.cshtml");
        }

        [HttpGet("GetQuestions")]
        public async Task<IActionResult> GetQuestions()
        {
            var questions = await _uow.SurveyQuestions.GetAllWithOptionsAsync();

            return Ok(questions.Select(q => new QuestionReadDto
            {
                Id = q.Id,
                Text = q.Text,
                IsMultipleChoice = q.IsMultipleChoice,
                AllowCustomAnswer = q.AllowCustomAnswer,
                OutOfTowners = q.OutOfTowners,
                ForCouple = q.ForCouple,
                Options = q.Options.Select(o => new OptionDto
                {
                    Id = o.Id,
                    Text = o.Text
                }).ToList()
            }));
        }

        [HttpPost("AddQuestion")]
        public async Task<IActionResult> AddQuestion([FromBody] QuestionDto dto)
        {
            if (dto == null)
                return BadRequest("Payload is null");

            var question = new SurveyQuestion
            {
                Text = dto.Text?.Trim() ?? "",
                IsMultipleChoice = dto.IsMultipleChoice,
                AllowCustomAnswer = dto.AllowCustomAnswer,
                OutOfTowners = dto.OutOfTowners,
                ForCouple = dto.ForCouple,
                Options = new List<QuestionOption>()
            };

            if (dto.Options != null)
            {
                foreach (var opt in dto.Options.Where(x => !string.IsNullOrWhiteSpace(x)))
                {
                    question.Options.Add(new QuestionOption { Text = opt.Trim() });
                }
            }

            await _uow.SurveyQuestions.AddAsync(question);
            await _uow.SaveAsync();

            return Ok();
        }

        [HttpPost("UpdateQuestion")]
        public async Task<IActionResult> UpdateQuestion([FromBody] QuestionDto dto)
        {
            if (dto == null)
                return BadRequest("Payload is null");

            var existing = await _uow.SurveyQuestions.GetWithOptionsAsync(dto.Id);

            if (existing == null)
                return NotFound();

            existing.Text = dto.Text?.Trim() ?? "";
            existing.IsMultipleChoice = dto.IsMultipleChoice;
            existing.AllowCustomAnswer = dto.AllowCustomAnswer;
            existing.OutOfTowners = dto.OutOfTowners;
            existing.ForCouple = dto.ForCouple;

            await _uow.SaveAsync();

            return Ok();
        }

        [HttpPost("DeleteQuestion/{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var q = await _uow.SurveyQuestions.GetByIdAsync(id);
            if (q == null) return NotFound();

            _uow.SurveyQuestions.Remove(q);
            await _uow.SaveAsync();

            return Ok();
        }
    }
}