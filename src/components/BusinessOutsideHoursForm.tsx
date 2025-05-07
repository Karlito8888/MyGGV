import { useState } from "react";
import { supabase } from "../lib/supabase";
import "./BusinessOutsideHoursForm.css";

interface BusinessOutsideHoursFormProps {
  businessId: string;
}

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function BusinessOutsideHoursForm({
  businessId,
}: BusinessOutsideHoursFormProps) {
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    openingTime: "",
    closingTime: "",
    hasBreak: false,
    breakStart: "",
    breakEnd: "",
    isClosed: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate hours
    if (!formData.isClosed) {
      if (!formData.openingTime || !formData.closingTime) {
        alert("Opening and closing times are required");
        return;
      }
      if (formData.hasBreak && (!formData.breakStart || !formData.breakEnd)) {
        alert("Break times are required");
        return;
      }
    }

    const { error } = await supabase.from("business_outside_hours").insert([
      {
        business_id: businessId,
        day_of_week: formData.dayOfWeek,
        opening_time: formData.isClosed ? null : formData.openingTime,
        closing_time: formData.isClosed ? null : formData.closingTime,
        has_break: formData.hasBreak,
        break_start:
          formData.isClosed || !formData.hasBreak ? null : formData.breakStart,
        break_end:
          formData.isClosed || !formData.hasBreak ? null : formData.breakEnd,
        is_closed: formData.isClosed,
      },
    ]);

    if (error) {
      alert("Error saving business hours");
      console.error(error);
    } else {
      alert("Business hours saved successfully");
      // Réinitialiser le formulaire ou rediriger
    }
  };

  return (
    <form onSubmit={handleSubmit} className="business-outside-hours-form">
      <div className="form-group">
        <label>Day of the week:</label>
        <select
          value={formData.dayOfWeek}
          onChange={(e) =>
            setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })
          }
        >
          {daysOfWeek.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.isClosed}
            onChange={(e) =>
              setFormData({ ...formData, isClosed: e.target.checked })
            }
          />
          Closed this day
        </label>
      </div>

      {!formData.isClosed && (
        <>
          <div>
            <label>Opening time:</label>
            <input
              type="time"
              value={formData.openingTime}
              onChange={(e) =>
                setFormData({ ...formData, openingTime: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label>Closing time:</label>
            <input
              type="time"
              value={formData.closingTime}
              onChange={(e) =>
                setFormData({ ...formData, closingTime: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                checked={formData.hasBreak}
                onChange={(e) =>
                  setFormData({ ...formData, hasBreak: e.target.checked })
                }
              />
              Has a break
            </label>
          </div>

          {formData.hasBreak && (
            <>
              <div>
                <label>Break start:</label>
                <input
                  type="time"
                  value={formData.breakStart}
                  onChange={(e) =>
                    setFormData({ ...formData, breakStart: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label>Break end:</label>
                <input
                  type="time"
                  value={formData.breakEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, breakEnd: e.target.value })
                  }
                  required
                />
              </div>
            </>
          )}
        </>
      )}

      <button type="submit">Save hours</button>
    </form>
  );
}
