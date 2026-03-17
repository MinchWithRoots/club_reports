-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id BIGSERIAL PRIMARY KEY,
  direction VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  supervisor_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(direction, name)
);

-- Create users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default clubs
INSERT INTO clubs (name) VALUES
  ('Клуб А'),
  ('Клуб Б'),
  ('Клуб В')
ON CONFLICT (name) DO NOTHING;

-- Insert default sections
INSERT INTO sections (direction, name, supervisor_name) VALUES
  ('КДН', 'Шахматы', 'Иванов Иван Иванович'),
  ('КДН', 'Рисование', 'Петрова Анна Сергеевна'),
  ('КДН', 'Музыка', 'Сидоров Пётр Николаевич'),
  ('ДПИ', 'Керамика', 'Сидорова Мария Петровна'),
  ('ДПИ', 'Вышивка', 'Козлов Дмитрий Андреевич'),
  ('ДПИ', 'Лепка', 'Волкова Елена Сергеевна'),
  ('Спортивное', 'Футбол', 'Смирнов Алексей Владимирович'),
  ('Спортивное', 'Баскетбол', 'Волкова Елена Сергеевна'),
  ('Спортивное', 'Плавание', 'Николаев Игорь Петрович'),
  ('Социальное', 'Волонтёры', 'Николаева Ольга Петровна'),
  ('Социальное', 'Помощь пожилым', 'Александрова Татьяна Ивановна'),
  ('Патриотическое', 'Юнармия', 'Петров Сергей Иванович'),
  ('Патриотическое', 'Поисковый отряд', 'Васильев Андрей Михайлович')
ON CONFLICT (direction, name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs(name);
CREATE INDEX IF NOT EXISTS idx_sections_direction ON sections(direction);
CREATE INDEX IF NOT EXISTS idx_sections_name ON sections(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
