using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wedding.DTO;
using Wedding.Models;
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

        // Страница управления вопросами (MVC view)
        [HttpGet("")]
        public async Task<IActionResult> Index()
        {
            // Если у репозитория есть метод для загрузки с опциями — используем его
            var questions = await _uow.SurveyQuestions.GetAllAsync();
            return View(questions);
        }

        // Получить все вопросы (JSON) — для фронтенда
        [HttpGet("GetQuestions")]
        public async Task<IActionResult> GetQuestions()
        {
            // Загружаем вопросы вместе с опциями (используем новый метод репозитория)
            var questions = await _uow.SurveyQuestions.GetAllWithOptionsAsync();

            var dto = questions.Select(q => new QuestionReadDto
            {
                Id = q.Id,
                Text = q.Text,
                IsMultipleChoice = q.IsMultipleChoice,
                AllowCustomAnswer = q.AllowCustomAnswer,
                OutOfTowners = q.OutOfTowners,
                ForCouple = q.ForCouple,
                Options = q.Options?.Select(o => new OptionDto { Id = o.Id, Text = o.Text }).ToList() ?? new List<OptionDto>()
            });

            return Ok(dto);
        }

        // Добавить вопрос (принимает QuestionDto в теле запроса)
        [HttpPost("AddQuestion")]
        public async Task<IActionResult> AddQuestion([FromBody] QuestionDto dto)
        {
            if (dto == null) return BadRequest("Payload is null.");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var question = new SurveyQuestion
            {
                Text = dto.Text?.Trim() ?? string.Empty,
                IsMultipleChoice = dto.IsMultipleChoice,
                AllowCustomAnswer = dto.AllowCustomAnswer, 
                OutOfTowners = dto.OutOfTowners, 
                ForCouple = dto.ForCouple
            };

            if (dto.Options != null && dto.Options.Any())
            {
                foreach (var opt in dto.Options.Where(o => !string.IsNullOrWhiteSpace(o)))
                {
                    question.Options.Add(new QuestionOption { Text = opt.Trim() });
                }
            }

            await _uow.SurveyQuestions.AddAsync(question);
            await _uow.SaveAsync();

            var created = await _uow.SurveyQuestions.GetWithOptionsAsync(question.Id);
            if (created == null)
            {
                return StatusCode(500, "Вопрос создан, но не удалось загрузить его для ответа.");
            }
            var resultDto = new QuestionReadDto
            {
                Id = created.Id,
                Text = created.Text,
                IsMultipleChoice = created.IsMultipleChoice,
                AllowCustomAnswer = created.AllowCustomAnswer,
                OutOfTowners = created.OutOfTowners,
                ForCouple = created.ForCouple,
                Options = created.Options?.Select(o => new OptionDto { Id = o.Id, Text = o.Text }).ToList() ?? new List<OptionDto>()
            };

            return CreatedAtAction(nameof(GetQuestions), new { id = resultDto.Id }, resultDto);
        }
        [HttpDelete("DeleteQuestion/{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var question = await _uow.SurveyQuestions.GetByIdAsync(id);
            if (question == null)
                return NotFound();

            _uow.SurveyQuestions.Remove(question);
            await _uow.SaveAsync();

            return NoContent();
        }
        [HttpPut("UpdateQuestion")]
        public async Task<IActionResult> UpdateQuestion([FromBody] QuestionDto dto)
        {
            if (dto == null)
                return BadRequest("Payload is null.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Получаем существующий вопрос вместе с опциями
            var existing = await _uow.SurveyQuestions.GetWithOptionsAsync(dto.Id);
            if (existing == null)
                return NotFound();

            // Обновляем простые поля
            existing.Text = dto.Text?.Trim() ?? string.Empty;
            existing.IsMultipleChoice = dto.IsMultipleChoice;
            existing.AllowCustomAnswer = dto.AllowCustomAnswer;
            existing.OutOfTowners = dto.OutOfTowners;
            existing.ForCouple = dto.ForCouple;

            // Удаляем старые опции через репозиторий опций (чтобы EF корректно отслеживал удаление)
            if (existing.Options != null && existing.Options.Any())
            {
                // Копируем в список, чтобы избежать модификации коллекции во время итерации
                var oldOptions = existing.Options.ToList();
                foreach (var opt in oldOptions)
                {
                    // Удаляем через репозиторий опций
                    _uow.QuestionOptions.Remove(opt);
                }
            }

            // Добавляем новые опции (если есть)
            if (dto.Options != null && dto.Options.Any())
            {
                foreach (var optText in dto.Options.Where(o => !string.IsNullOrWhiteSpace(o)))
                {
                    var newOpt = new QuestionOption
                    {
                        Text = optText.Trim(),
                        QuestionId = existing.Id
                    };
                    // Можно добавить в навигационную коллекцию и/или через репозиторий
                    existing.Options.Add(newOpt);
                    // Если хотите, можно также вызвать _uow.QuestionOptions.AddAsync(newOpt);
                }
            }

            // Обновляем вопрос (репозиторий)
            _uow.SurveyQuestions.Update(existing);
            await _uow.SaveAsync();

            // Загружаем обновлённый вопрос с опциями для ответа (чтобы вернуть актуальные id опций)
            var updated = await _uow.SurveyQuestions.GetWithOptionsAsync(existing.Id);
            if (updated == null)
                return StatusCode(500, "Не удалось загрузить обновлённый вопрос.");

            var resultDto = new QuestionReadDto
            {
                Id = updated.Id,
                Text = updated.Text,
                IsMultipleChoice = updated.IsMultipleChoice,
                AllowCustomAnswer = updated.AllowCustomAnswer,
                OutOfTowners = updated.OutOfTowners,
                ForCouple = updated.ForCouple,
                Options = updated.Options?.Select(o => new OptionDto { Id = o.Id, Text = o.Text }).ToList()
                          ?? new List<OptionDto>()
            };

            return Ok(resultDto);
        }
    }
}
