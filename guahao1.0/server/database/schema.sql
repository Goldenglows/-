CREATE DATABASE IF NOT EXISTS hospital
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE hospital;

CREATE TABLE IF NOT EXISTS doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  title VARCHAR(50) NOT NULL,
  avatar VARCHAR(255),
  good TEXT,
  intro TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  fast_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diseases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT NOT NULL,
  schedule_date DATE NOT NULL,
  schedule_time TIME NOT NULL,
  remaining INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_schedule (
    doctor_id,
    schedule_date,
    schedule_time
  ),
  CONSTRAINT fk_schedule_doctor
    FOREIGN KEY (doctor_id)
    REFERENCES doctors(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT NOT NULL,
  patient_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  disease VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  description TEXT,
  type ENUM('normal','fast') NOT NULL DEFAULT 'normal',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM(
    'pending',
    'confirmed',
    'completed',
    'cancelled'
  ) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointment_doctor
    FOREIGN KEY (doctor_id)
    REFERENCES doctors(id)
);

CREATE TABLE IF NOT EXISTS view_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_view_doctor_time (
    doctor_id,
    created_at
  ),
  CONSTRAINT fk_view_doctor
    FOREIGN KEY (doctor_id)
    REFERENCES doctors(id)
    ON DELETE CASCADE
);

INSERT INTO doctors (
  name,
  title,
  avatar,
  good,
  intro,
  price,
  fast_price
)
SELECT
  '边正远',
  '主任医师',
  '/images/doctor1.jpg',
  '擅长中医内科，呼吸科（慢支），脾胃消化系统，糖尿病（消渴），心血管系统（心悸，胸痹，不寐）。周围面神经麻痹、颈椎病，中耳炎有擅长，将药物、针炙推拿有机结合起来运用于各种疾病。',
  '中医师本人毕业于新疆医科大学中医专业，从事临床30多年。',
  30,
  80
WHERE NOT EXISTS (
  SELECT 1 FROM doctors WHERE name = '边正远'
);

INSERT INTO doctors (
  name,
  title,
  avatar,
  good,
  intro,
  price,
  fast_price
)
SELECT
  '朱文明',
  '主任医师',
  '/images/doctor2.jpg',
  '运用中医督脉脊柱微创疗法，刃针，银质针，针刀针灸治疗，将中医的整体观念和西医的精微解剖相结合，总结出的新的治疗方法。擅长颈椎病，肩周炎，腰椎间盘突出，骨性关节炎，类风湿性关节炎，痛风性关节炎，头晕，头痛，中风后遗症，以及康复训练，等各项顽固性疼痛症。',
  '毕业于陕西中医药大学，从事中医科康复十多年，曾在郑州附大一院进修学习。',
  40,
  100
WHERE NOT EXISTS (
  SELECT 1 FROM doctors WHERE name = '朱文明'
);

DELETE FROM diseases;

INSERT INTO diseases (name, sort_order) VALUES
('高血糖', 1),
('高血压', 2),
('腰椎肩颈疾病', 3),
('皮肤疾病', 4),
('其他疼痛', 5);