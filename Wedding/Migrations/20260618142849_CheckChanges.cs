using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wedding.Migrations
{
    /// <inheritdoc />
    public partial class CheckChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ChildrenCount",
                table: "Guests",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChildrenCount",
                table: "Guests");
        }
    }
}
