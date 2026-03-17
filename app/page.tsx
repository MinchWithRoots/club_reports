"use client";

import { useState, useEffect } from "react";
import { utils, writeFile } from "xlsx";
import type { Report, ClubSummary, FormData, Direction } from "@/types/database";
import { DIRECTIONS, RATES, PERIODS } from "@/types/database";
import ComboBox from "@/components/ComboBox";
import ProtectedPage from "@/components/ProtectedPage";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

interface ClubItem {
  id: number | string;
  name: string;
}

interface SectionItem {
  id: number | string;
  direction: string;
  name: string;
  supervisor_name: string;
}

const CLUBS: ClubItem[] = [];

const SECTIONS_STATIC: Record<Direction, { name: string; supervisor: string }[]> = {
  'КДН': [
    { name: "Шахматы", supervisor: "Иванов Иван Иванович" },
    { name: "Рисование", supervisor: "Петрова Анна Сергеевна" },
    { name: "Музыка", supervisor: "Сидоров Пётр Николаевич" },
  ],
  'ДПИ': [
    { name: "Керамика", supervisor: "Сидорова Мария Петровна" },
    { name: "Вышивка", supervisor: "Козлов Дмитрий Андреевич" },
    { name: "Лепка", supervisor: "Волкова Елена Сергеевна" },
  ],
  'Спортивное': [
    { name: "Футбол", supervisor: "Смирнов Алексей Владимирович" },
    { name: "Баскетбол", supervisor: "Волкова Елена Сергеевна" },
    { name: "Плавание", supervisor: "Николаев Игорь Петрович" },
  ],
  'Социальное': [
    { name: "Волонтёры", supervisor: "Николаева Ольга Петровна" },
    { name: "Помощь пожилым", supervisor: "Александрова Татьяна Ивановна" },
  ],
  'Патриотическое': [
    { name: "Юнармия", supervisor: "Петров Сергей Иванович" },
    { name: "Поисковый отряд", supervisor: "Васильев Андрей Михайлович" },
  ],
};

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    club_name: "",
    direction: "",
    section_name: "",
    supervisor_name: "",
    period: PERIODS[new Date().getMonth()],
    rate: "1",
    norm_capacity_people: "",
    actual_age_14_17: "",
    actual_age_18_35: "",
    norm_capacity_families: "",
    actual_families: "",
    norm_mso: "",
    mso_age_14_17: "",
    mso_age_18_35: "",
    notes: "",
    password: "",
  });

  const [selectedPeriod, setSelectedPeriod] = useState<string>(PERIODS[new Date().getMonth()]);
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [availableSections, setAvailableSections] = useState<SectionItem[]>([]);
  const [data, setData] = useState<Report[]>([]);
  const [summary, setSummary] = useState<ClubSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadClubs();
    loadSections();
  }, []);

  const loadClubs = async () => {
    try {
      const res = await fetch("/api/clubs");
      const json = await res.json();
      if (json.success) {
        setClubs(json.clubs);
      }
    } catch (err) {
      console.error("Error loading clubs:", err);
    }
  };

  const loadSections = async () => {
    try {
      const res = await fetch("/api/sections");
      const json = await res.json();
      if (json.success) {
        setSections(json.sections);
      }
    } catch (err) {
      console.error("Error loading sections:", err);
    }
  };

  useEffect(() => {
    loadData(selectedPeriod);
  }, [selectedPeriod]);

  useEffect(() => {
    if (formData.direction) {
      const filtered = sections.filter(s => s.direction === formData.direction);
      setAvailableSections(filtered);
      setFormData(prev => ({ ...prev, section_name: "", supervisor_name: "" }));
    }
  }, [formData.direction, sections]);

  useEffect(() => {
    if (formData.section_name && availableSections.length > 0) {
      const section = availableSections.find(s => s.name === formData.section_name);
      if (section) {
        setFormData(prev => ({ ...prev, supervisor_name: section.supervisor_name }));
      }
    }
  }, [formData.section_name, availableSections]);

  const loadData = async (period: string) => {
    try {
      const res = await fetch(`/api/report?period=${period}`);
      const json = await res.json();
      if (res.ok) {
        setData(json.raw);
        setSummary(json.summary);
      } else {
        setMessage("❌ " + json.error);
      }
    } catch (err) {
      console.error("Load error:", err);
      setMessage("❌ Ошибка загрузки");
    }
  };

  const createClub = async (clubName: string): Promise<ClubItem | null> => {
    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clubName }),
      });
      const json = await res.json();
      if (json.success) {
        const club = json.club;
        setClubs(prev => [...prev.filter(c => c.name !== club.name), club]);
        setMessage(`✅ Клуб "${clubName}" добавлен!`);
        return club;
      } else {
        setMessage("❌ " + json.error);
        return null;
      }
    } catch (err) {
      console.error("Club creation error:", err);
      setMessage("❌ Ошибка при добавлении клуба");
      return null;
    }
  };

  const createSection = async (
    direction: string,
    sectionName: string,
    supervisorName: string
  ): Promise<SectionItem | null> => {
    try {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, name: sectionName, supervisor_name: supervisorName }),
      });
      const json = await res.json();
      if (json.success) {
        const section = json.section;
        setSections(prev => [...prev.filter(s => s.name !== section.name), section]);
        const filtered = sections.filter(s => s.direction === direction);
        setAvailableSections([...filtered.filter(s => s.name !== section.name), section]);
        setMessage(`✅ Секция "${sectionName}" добавлена!`);
        return section;
      } else {
        setMessage("❌ " + json.error);
        return null;
      }
    } catch (err) {
      console.error("Section creation error:", err);
      setMessage("❌ Ошибка при добавлении секции");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (res.ok) {
        setMessage("✅ Отправлено!");
        setFormData(prev => ({
          ...prev,
          rate: "1",
          norm_capacity_people: "",
          actual_age_14_17: "",
          actual_age_18_35: "",
          norm_capacity_families: "",
          actual_families: "",
          norm_mso: "",
          mso_age_14_17: "",
          mso_age_18_35: "",
          notes: "",
        }));
        loadData(selectedPeriod);
      } else {
        setMessage("❌ " + json.message);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setMessage("❌ Ошибка отправки");
    } finally {
      setLoading(false);
    }
  };

    const downloadExcelServer = async () => {
    setMessage("");
    if (data.length === 0) {
      setMessage("⚠️ Нет данных за выбранный период!");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/export?period=${selectedPeriod}`);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Ошибка при генерации файла");
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error("Полученный файл пуст");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage("✅ Excel скачан!");
    } catch (err) {
      console.error("Export error:", err);
      setMessage("❌ " + (err instanceof Error ? err.message : "Ошибка экспорта"));
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    try {
      if (data.length === 0) {
        setMessage("⚠️ Нет данных за выбранный период!");
        return;
      }

      const today = new Date().toLocaleDateString('ru-RU');

      // === ЛИСТ 1: Данные ===
      const sheet1Data: (string | number)[][] = [];

      sheet1Data.push([
        "№ п/п",
        `ФИО работника\nСведения на ${today}`,
        "Подразделение",
        "Название кружка, секции, клубного формирования",
        "Нагрузка",
        "Норма наполняемости",
        "Количество кружков",
        "Направление работы",
        "Количество занимающихся",
        "",
        "",
        "Примечание",
      ]);

      sheet1Data.push([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "14-18 лет",
        "18-35 лет",
        "молодая семья",
        "",
      ]);

      let rowNum = 1;
      let totalRate = 0;
      let totalSections = 0;
      let totalAge14_17 = 0;
      let totalAge18_35 = 0;
      let totalFamilies = 0;

      data.forEach((row: Report) => {
        sheet1Data.push([
          rowNum++,
          row.supervisor_name,
          row.club_name,
          row.section_name,
          row.rate,
          row.norm_capacity_people,
          1,
          row.direction,
          row.actual_age_14_17,
          row.actual_age_18_35,
          row.actual_families,
          row.notes,
        ]);

        totalRate += row.rate;
        totalSections += 1;
        totalAge14_17 += row.actual_age_14_17;
        totalAge18_35 += row.actual_age_18_35;
        totalFamilies += row.actual_families;
      });

      sheet1Data.push([
        "Итого",
        "",
        "",
        "",
        totalRate,
        "",
        totalSections,
        "",
        totalAge14_17,
        totalAge18_35,
        totalFamilies,
        "",
      ]);

      // === ЛИСТ 2: Итоги по клубам ===
      interface ClubStats {
        club_name: string;
        total_sections: number;
        total_rate: number;
        total_norm_people: number;
        total_people: number;
        total_families: number;
        total_norm_mso: number;
        total_mso: number;
        notes: string;
      }

      const sheet2Data: (string | number)[][] = [];

      sheet2Data.push([
        "№ п/п",
        "Название клуба",
        "Количество кружков",
        "Нагрузка (общая)",
        "Норма занимающихся (общая)",
        "Количество занимающихся",
        "Количество семей",
        "",
        "",
        "Норма МСО",
        "МСО фактическое",
        "Примечание",
      ]);

      let clubNum = 1;
      summary.forEach((club: ClubStats) => {
        sheet2Data.push([
          clubNum++,
          club.club_name,
          club.total_sections,
          club.total_rate,
          club.total_norm_people,
          club.total_people,
          club.total_families,
          "",
          "",
          club.total_norm_mso,
          club.total_mso,
          club.notes,
        ]);
      });

      const wb = utils.book_new();
      const ws1 = utils.aoa_to_sheet(sheet1Data);
      utils.book_append_sheet(wb, ws1, "Данные");
      const ws2 = utils.aoa_to_sheet(sheet2Data);
      utils.book_append_sheet(wb, ws2, "Итоги по клубам");

      const filename = `Report_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.xlsx`;
      writeFile(wb, filename);
      setMessage("✅ Excel скачан (локально)!");
    } catch (err) {
      console.error("Excel error:", err);
      setMessage("❌ Ошибка Excel: " + (err instanceof Error ? err.message : "Неизвестная ошибка"));
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <ProtectedPage>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1 className="title">📊 Отчётность детских кружков</h1>
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <span style={{ fontSize: "14px" }}>👤 {user?.full_name}</span>
            <button onClick={handleLogout} className="btn" style={{ padding: "8px 12px", fontSize: "14px" }}>
              🚪 Выход
            </button>
          </div>
        </div>

      {/* Выбор периода */}
      <div className="period-selector">
        <label>Выберите период для отчёта:</label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="input"
        >
          {PERIODS.map(period => (
            <option key={period} value={period}>{period}</option>
          ))}
        </select>
      </div>

      {/* Форма */}
      <div className="card">
        <h2>Внести данные</h2>
        <form onSubmit={handleSubmit} className="form">
          {isClient && (
            <ComboBox
              items={clubs}
              value={formData.club_name}
              onChange={(value) => setFormData({ ...formData, club_name: value })}
              onAddNew={createClub}
              placeholder="Выберите или добавьте клуб"
              className="input"
              displayKey="name"
              allowNew={true}
            />
          )}

          <select
            value={formData.direction}
            onChange={(e) => setFormData({ ...formData, direction: e.target.value as Direction })}
            className="input"
            required
          >
            <option value="">Выберите направление</option>
            {DIRECTIONS.map(dir => (
              <option key={dir} value={dir}>{dir}</option>
            ))}
          </select>

          {isClient && (
            <ComboBox
              items={availableSections}
              value={formData.section_name}
              onChange={(value) => setFormData({ ...formData, section_name: value })}
              onAddNew={(sectionName) =>
                createSection(formData.direction as Direction, sectionName, "")
              }
              placeholder="Выберите или добавьте секцию"
              className="input"
              displayKey="name"
              allowNew={true}
              disabled={!formData.direction}
            />
          )}

          <input
            type="text"
            placeholder="ФИО руководителя"
            value={formData.supervisor_name}
            onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
            className="input"
            required
            style={{ backgroundColor: formData.supervisor_name ? '#fff' : '#f5f5f5' }}
          />

          <select
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            className="input"
            required
          >
            <option value="">Выберите период</option>
            {PERIODS.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>

          <select
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            className="input"
            required
          >
            <option value="">Выберите ставку</option>
            {RATES.map(rate => (
              <option key={rate} value={rate}>{rate}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Норма наполняемости (чел.)"
            value={formData.norm_capacity_people}
            onChange={(e) => setFormData({ ...formData, norm_capacity_people: e.target.value })}
            className="input"
            min="0"
            step="0.01"
          />

          <div className="form-row">
            <label>Фактическое кол-во занимающихся (чел.)</label>
            <div className="form-row-inner">
              <input
                type="number"
                placeholder="14-17 лет"
                value={formData.actual_age_14_17}
                onChange={(e) => setFormData({ ...formData, actual_age_14_17: e.target.value })}
                className="input"
                min="0"
                required
              />
              <input
                type="number"
                placeholder="18-35 лет"
                value={formData.actual_age_18_35}
                onChange={(e) => setFormData({ ...formData, actual_age_18_35: e.target.value })}
                className="input"
                min="0"
                required
              />
            </div>
            <small className="hint">
              Всего: {(Number(formData.actual_age_14_17) || 0) + (Number(formData.actual_age_18_35) || 0)} чел.
            </small>
          </div>

          <input
            type="number"
            placeholder="Норма наполняемости (семьи)"
            value={formData.norm_capacity_families}
            onChange={(e) => setFormData({ ...formData, norm_capacity_families: e.target.value })}
            className="input"
            min="0"
          />

          <input
            type="number"
            placeholder="Факт (семьи)"
            value={formData.actual_families}
            onChange={(e) => setFormData({ ...formData, actual_families: e.target.value })}
            className="input"
            min="0"
          />

          <input
            type="number"
            placeholder="Норма МСО"
            value={formData.norm_mso}
            onChange={(e) => setFormData({ ...formData, norm_mso: e.target.value })}
            className="input"
            min="0"
          />

          <div className="form-row">
            <label>МСО фактическое</label>
            <div className="form-row-inner">
              <input
                type="number"
                placeholder="14-17 лет"
                value={formData.mso_age_14_17}
                onChange={(e) => setFormData({ ...formData, mso_age_14_17: e.target.value })}
                className="input"
                min="0"
              />
              <input
                type="number"
                placeholder="18-35 лет"
                value={formData.mso_age_18_35}
                onChange={(e) => setFormData({ ...formData, mso_age_18_35: e.target.value })}
                className="input"
                min="0"
              />
            </div>
            <small className="hint">
              Всего МСО: {(Number(formData.mso_age_14_17) || 0) + (Number(formData.mso_age_18_35) || 0)}
            </small>
          </div>

          <textarea
            placeholder="Примечание"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input textarea"
            rows={3}
          />

          <input
            type="password"
            placeholder="Пароль (club2024)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input"
            required
          />

          <button type="submit" disabled={loading} className={loading ? "btn-disabled" : "btn"}>
            {loading ? "..." : "Отправить"}
          </button>
        </form>
        {message && <p className="msg">{message}</p>}
      </div>

      {/* Экспорт и сводка */}
      <div className="card">
        <h2>📈 Итоги за {selectedPeriod}</h2>
        {summary.length > 0 ? (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={downloadExcelServer} disabled={loading} className="excel-btn">
                📥 Скачать Excel (Сервер)
              </button>
              <button onClick={downloadExcel} className="excel-btn">
                📥 Скачать Excel (Браузер)
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Клуб</th>
                  <th>Кружков</th>
                  <th>Нагрузка</th>
                  <th>Норма</th>
                  <th>Люди</th>
                  <th>Семьи</th>
                  <th>МСО норма</th>
                  <th>МСО факт</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((club) => (
                  <tr key={club.club_name}>
                    <td>{club.club_name}</td>
                    <td>{club.total_sections}</td>
                    <td>{club.total_rate}</td>
                    <td>{club.total_norm_people}</td>
                    <td>{club.total_people}</td>
                    <td>{club.total_families}</td>
                    <td>{club.total_norm_mso}</td>
                    <td>{club.total_mso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p>Нет данных за выбранный период</p>
        )}
      </div>

      {/* Последние записи */}
      <div className="card">
        <h3>Последние записи</h3>
        <ul className="list">
          {data.slice(0, 5).map((row) => (
            <li key={row.id}>
              <b>{row.club_name}</b> • {row.direction} • {row.section_name}: 
              {row.actual_total_people} чел., МСО: {row.mso_total}
            </li>
          ))}
        </ul>
      </div>
    </div>
    </ProtectedPage>
  );
}
