using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SyncCustomerPortalTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Add missing columns to ServiceReviews table
            migrationBuilder.AddColumn<int>(
                name: "AppointmentId",
                table: "ServiceReviews",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsVisible",
                table: "ServiceReviews",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "ServiceReviews",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            // Make Comment nullable in ServiceReviews (it was non-nullable in old migration)
            migrationBuilder.AlterColumn<string>(
                name: "Comment",
                table: "ServiceReviews",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000);

            // Add Foreign Key for AppointmentId to Appointments table
            migrationBuilder.AddForeignKey(
                name: "FK_ServiceReviews_Appointments_AppointmentId",
                table: "ServiceReviews",
                column: "AppointmentId",
                principalTable: "Appointments",
                principalColumn: "Id");

            // Add Index for AppointmentId
            migrationBuilder.CreateIndex(
                name: "IX_ServiceReviews_AppointmentId",
                table: "ServiceReviews",
                column: "AppointmentId");

            // 2. Add missing columns to PartRequests table
            migrationBuilder.AddColumn<string>(
                name: "PartNumber",
                table: "PartRequests",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "PartRequests",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop Index & Foreign Key
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceReviews_Appointments_AppointmentId",
                table: "ServiceReviews");

            migrationBuilder.DropIndex(
                name: "IX_ServiceReviews_AppointmentId",
                table: "ServiceReviews");

            // Drop ServiceReviews columns
            migrationBuilder.DropColumn(
                name: "AppointmentId",
                table: "ServiceReviews");

            migrationBuilder.DropColumn(
                name: "IsVisible",
                table: "ServiceReviews");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "ServiceReviews");

            // Revert Comment to non-nullable
            migrationBuilder.AlterColumn<string>(
                name: "Comment",
                table: "ServiceReviews",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            // Drop PartRequests columns
            migrationBuilder.DropColumn(
                name: "PartNumber",
                table: "PartRequests");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "PartRequests");
        }
    }
}
