using Microsoft.AspNetCore.Mvc;
using Wedding.Models;
using Wedding.Security;
using Wedding.UnitOfWork;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Wedding.Controllers
{
    public class AdminGuestsController : Controller
    {
        private readonly IUnitOfWork _uow;

        public AdminGuestsController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<IActionResult> Index()
        {
            if (!AdminAuthHelper.IsAuthorized(HttpContext))
                return RedirectToAction("Locked");

            var guests = await _uow.Guests.GetAllAsync();
            return View(guests);
        }

        public IActionResult Locked()
        {
            return View("~/Views/Shared/Locked.cshtml");
        }

        [HttpPost]
        public async Task<IActionResult> AddGuest([FromBody] Guest guest)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            if (!guest.CoupleOrNot && guest.Gender == null)
                return BadRequest("Не выбран пол гостя");

            await _uow.Guests.AddAsync(guest);
            await _uow.SaveAsync();

            return Ok(guest);
        }

        [HttpPost]
        public async Task<IActionResult> DeleteGuest(int id)
        {
            var guest = await _uow.Guests.GetByIdAsync(id);
            if (guest == null)
                return NotFound();

            _uow.Guests.Remove(guest);
            await _uow.SaveAsync();

            return Ok();
        }

        [HttpPost]
        public async Task<IActionResult> UpdateGuest([FromBody] Guest guest)
        {
            var existing = await _uow.Guests.GetByIdAsync(guest.Id);
            if (existing == null)
                return NotFound();

            existing.Name = guest.Name;
            existing.City = guest.City;
            //existing.Email = guest.Email;
            existing.CoupleOrNot = guest.CoupleOrNot;
            existing.YoungOrNot = guest.YoungOrNot;

            existing.Gender = guest.Gender;
            existing.HusbandGuestOrNot = guest.HusbandGuestOrNot;
            existing.WifeGuestOrNot = guest.WifeGuestOrNot;
            existing.RelativeOrNot = guest.RelativeOrNot;
            existing.FriendOrNot = guest.FriendOrNot;

            _uow.Guests.Update(existing);
            await _uow.SaveAsync();

            return Ok(existing);
        }

        [HttpGet]
        public async Task<IActionResult> SearchGuests(string query)
        {
            var guests = await _uow.Guests.FindAsync(g =>
                g.Name.Contains(query) ||
                g.City.Contains(query)
                //(g.Email != null && g.Email.Contains(query))
            );

            return Ok(guests);
        }

        [HttpGet]
        public async Task<IActionResult> GetGuests()
        {
            var guests = await _uow.Guests.GetAllAsync();
            return Ok(guests);
        }
    }

}
