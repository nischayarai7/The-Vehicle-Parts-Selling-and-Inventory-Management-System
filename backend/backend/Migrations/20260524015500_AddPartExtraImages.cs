using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPartExtraImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "image_url_2",
                table: "parts",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "image_url_3",
                table: "parts",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PartReviews");

            migrationBuilder.DropColumn(
                name: "LastNotificationSentAt",
                table: "pending_credits");

            migrationBuilder.DropColumn(
                name: "image_url_2",
                table: "parts");

            migrationBuilder.DropColumn(
                name: "image_url_3",
                table: "parts");
        }
    }
}
