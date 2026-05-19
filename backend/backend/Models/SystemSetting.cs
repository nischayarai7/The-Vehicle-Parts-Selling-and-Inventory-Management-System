using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("system_settings")]
    public class SystemSetting
    {
        [Key]
        [Column("key")]
        public string Key { get; set; } = string.Empty;

        [Column("value")]
        public string? Value { get; set; }
    }
}
