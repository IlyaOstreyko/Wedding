using Wedding.Interfaces;

namespace Wedding.UnitOfWork
{
    public interface IUnitOfWork
    {
        IGuestRepository Guests { get; }
        ISurveyQuestionRepository SurveyQuestions { get; }
        ISurveyAnswerRepository SurveyAnswers { get; }
        IQuestionOptionRepository QuestionOptions { get; }

        Task<int> SaveAsync();
    }
}
