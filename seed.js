const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./health.db");

function calculateRisk(sleep_hours, steps, mood_score) {
  if (sleep_hours < 5.5) {
    if (steps < 4000) {
      return "高風險";
    } else {
      if (mood_score <= 4) {
        return "高風險";
      } else {
        return "中風險";
      }
    }
  } else {
    if (sleep_hours >= 7) {
      if (steps >= 6000) {
        if (mood_score >= 6) {
          return "低風險";
        } else {
          return "中風險";
        }
      } else {
        return "中風險";
      }
    } else {
      if (mood_score <= 4) {
        return "中風險";
      } else {
        return "低風險";
      }
    }
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(1));
}

function getDateBefore(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS health_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_date DATE NOT NULL,
      sleep_hours REAL NOT NULL,
      steps INTEGER NOT NULL,
      mood_score INTEGER NOT NULL,
      risk_level TEXT
    )
  `);

  db.run("DELETE FROM health_logs");

  const stmt = db.prepare(`
    INSERT INTO health_logs 
    (log_date, sleep_hours, steps, mood_score, risk_level)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < 90; i++) {
    let sleep_hours;
    let steps;
    let mood_score;

    if (i < 30) {
      // 高風險
      sleep_hours = randomFloat(4.0, 5.4);
      steps = randomInt(1000, 3500);
      mood_score = randomInt(1, 4);
    } else if (i < 60) {
      // 中風險
      sleep_hours = randomFloat(5.5, 6.9);
      steps = randomInt(3500, 6500);
      mood_score = randomInt(4, 6);
    } else {
      // 低風險
      sleep_hours = randomFloat(7.0, 9.0);
      steps = randomInt(6000, 10000);
      mood_score = randomInt(6, 10);
    }

    const log_date = getDateBefore(89 - i);
    const risk_level = calculateRisk(sleep_hours, steps, mood_score);

    stmt.run(log_date, sleep_hours, steps, mood_score, risk_level);
  }

  stmt.finalize();

  console.log("已成功產生 90 筆健康日誌種子資料");
});

db.close();