using Microsoft.AspNetCore.Mvc;
using Wedding.Security;
using Wedding.UnitOfWork;
using Wedding.ViewModels;

namespace Wedding.Controllers
{
    public class AdminStatisticsController : Controller
    {
        private readonly IUnitOfWork _uow;

        public AdminStatisticsController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<IActionResult> Index()
        {
            if (!AdminAuthHelper.IsAuthorized(HttpContext))
                return RedirectToAction("Locked");

            var guests = await _uow.Guests.GetAllWithAnswersAsync();

            var questions =
                (await _uow.SurveyQuestions.GetAllWithOptionsAsync())
                .ToList();

            var model = new SurveyAnswersAdminVm();

            model.Guests = guests
                .Select(g => new GuestAnswersVm
                {
                    GuestId = g.Id,
                    GuestName = g.Name,
                    City = g.City,
                    Confirmation = g.Confirmation,

                    Answers = g.SurveyAnswers
                        .OrderBy(x => x.Question.Id)
                        .Select(a => new AnswerVm
                        {
                            Question = a.Question.Text,

                            Answer =
                                !string.IsNullOrWhiteSpace(a.CustomAnswer)
                                    ? a.CustomAnswer!
                                    : a.SelectedOption?.Text ?? "-"
                        })
                        .ToList()
                })
                .OrderBy(x => x.GuestName)
                .ToList();

            //model.Questions = questions
            //    .Select(q => new QuestionSummaryVm
            //    {
            //        QuestionId = q.Id,

            //        Question = q.Text,

            //        Options = q.Options
            //            .Select(o => new OptionCountVm
            //            {
            //                Option = o.Text,

            //                Count = guests
            //                    .SelectMany(g => g.SurveyAnswers)
            //                    .Count(a => a.SelectedOptionId == o.Id)
            //            })
            //            .Where(x => x.Count > 0)
            //            .OrderByDescending(x => x.Count)
            //            .ToList(),

            //        CustomAnswers = guests
            //            .SelectMany(g => g.SurveyAnswers)
            //            .Where(a =>
            //                a.QuestionId == q.Id &&
            //                !string.IsNullOrWhiteSpace(a.CustomAnswer))
            //            .Select(a => a.CustomAnswer!)
            //            .Distinct()
            //            .ToList()
            //    })
            //    .ToList();
            // 2. Формирование сводки по вопросам (С учетом свободных ответов пар)
            model.Questions = questions
                .Select(q => new QuestionSummaryVm
                {
                    QuestionId = q.Id,
                    Question = q.Text,

                    Options = q.Options
                        .Select(o => new OptionCountVm
                        {
                            Option = o.Text,

                            Count = guests
                                .Where(g => g.SurveyAnswers.Any(a => a.SelectedOptionId == o.Id))
                                .Sum(g =>
                                {
                                    bool isPair = g.CoupleOrNot;

                                    int selectedOptionsCount = g.SurveyAnswers
                                        .Count(a => a.QuestionId == q.Id && a.SelectedOptionId != null);

                                    bool hasCustomAnswer = g.SurveyAnswers
                                        .Any(a => a.QuestionId == q.Id && !string.IsNullOrWhiteSpace(a.CustomAnswer));

                                    if (isPair && selectedOptionsCount == 1 && !hasCustomAnswer)
                                    {
                                        return 2;
                                    }

                                    return 1;
                                })
                        })
                        .Where(x => x.Count > 0)
                        .OrderByDescending(x => x.Count)
                        .ToList(),

                    CustomAnswers = guests
                        .SelectMany(g => g.SurveyAnswers)
                        .Where(a => a.QuestionId == q.Id && !string.IsNullOrWhiteSpace(a.CustomAnswer))
                        .Select(a => a.CustomAnswer!)
                        .Distinct()
                        .ToList()
                })
                .ToList();

            return View(model);
        }

        public IActionResult Locked()
        {
            return View("~/Views/Shared/Locked.cshtml");
        }
    }
}
