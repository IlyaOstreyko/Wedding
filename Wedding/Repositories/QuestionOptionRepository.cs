using Microsoft.EntityFrameworkCore;
using Wedding.Data;
using Wedding.Interfaces;
using Wedding.Models;

namespace Wedding.Repositories
{
    public class QuestionOptionRepository
        : GenericRepository<QuestionOption>, IQuestionOptionRepository
    {
        public QuestionOptionRepository(AppDbContext context) : base(context) { }

        public async Task<List<SurveyQuestion>> GetAllWithOptionsAsync()
        {
            return await _context.SurveyQuestions
                .Include(q => q.Options)
                .ToListAsync();
        }

        public async Task<IEnumerable<QuestionOption>> GetByQuestionIdAsync(int questionId)
        {
            return await _dbSet
                .Where(o => o.QuestionId == questionId)
                .ToListAsync();
        }
    }
}
