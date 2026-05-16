using Wedding.Data;
using Wedding.Interfaces;
using Wedding.Repositories;

namespace Wedding.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;

        public IGuestRepository Guests { get; }
        public ISurveyQuestionRepository SurveyQuestions { get; }
        public ISurveyAnswerRepository SurveyAnswers { get; }
        public IQuestionOptionRepository QuestionOptions { get; }

        public UnitOfWork(AppDbContext context)
        {
            _context = context;

            Guests = new GuestRepository(context);
            SurveyQuestions = new SurveyQuestionRepository(context);
            SurveyAnswers = new SurveyAnswerRepository(context);
            QuestionOptions = new QuestionOptionRepository(context);
        }

        public async Task<int> SaveAsync() =>
            await _context.SaveChangesAsync();
    }
}
