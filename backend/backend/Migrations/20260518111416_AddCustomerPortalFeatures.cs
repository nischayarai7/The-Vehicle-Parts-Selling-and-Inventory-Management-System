using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerPortalFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
//             migrationBuilder.CreateTable(
//                 name: "PartRequests",
//                 columns: table => new
//                 {
//                     Id = table.Column<int>(type: "integer", nullable: false)
//                         .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
//                     CustomerId = table.Column<int>(type: "integer", nullable: false),
//                     PartName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
//                     PartNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
//                     VehicleDetails = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
//                     Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
//                     Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
//                     CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
//                 },
//                 constraints: table =>
//                 {
//                     table.PrimaryKey("PK_PartRequests", x => x.Id);
//                     table.ForeignKey(
//                         name: "FK_PartRequests_users_CustomerId",
//                         column: x => x.CustomerId,
//                         principalTable: "users",
//                         principalColumn: "id",
//                         onDelete: ReferentialAction.Cascade);
//                 });

//             migrationBuilder.CreateTable(
//                 name: "ServiceReviews",
//                 columns: table => new
//                 {
//                     Id = table.Column<int>(type: "integer", nullable: false)
//                         .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
//                     CustomerId = table.Column<int>(type: "integer", nullable: false),
//                     AppointmentId = table.Column<int>(type: "integer", nullable: true),
//                     Rating = table.Column<int>(type: "integer", nullable: false),
//                     Comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
//                     IsVisible = table.Column<bool>(type: "boolean", nullable: false),
//                     CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
//                     UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
//                 },
//                 constraints: table =>
//                 {
//                     table.PrimaryKey("PK_ServiceReviews", x => x.Id);
//                     table.ForeignKey(
//                         name: "FK_ServiceReviews_Appointments_AppointmentId",
//                         column: x => x.AppointmentId,
//                         principalTable: "Appointments",
//                         principalColumn: "Id");
//                     table.ForeignKey(
//                         name: "FK_ServiceReviews_users_CustomerId",
//                         column: x => x.CustomerId,
//                         principalTable: "users",
//                         principalColumn: "id",
//                         onDelete: ReferentialAction.Cascade);
//                 });

//             migrationBuilder.CreateIndex(
//                 name: "IX_ServiceReviews_AppointmentId",
//                 table: "ServiceReviews",
//                 column: "AppointmentId");

//             migrationBuilder.CreateIndex(
//                 name: "IX_ServiceReviews_CustomerId",
//                 table: "ServiceReviews",
//                 column: "CustomerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
//             migrationBuilder.DropTable(
//                 name: "PartRequests");

            migrationBuilder.DropTable(
                name: "ServiceReviews");
        }
    }
}
