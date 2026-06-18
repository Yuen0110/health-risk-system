const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 建立 SQLite 資料庫
const db = new sqlite3.Database("./health.db", (err) => {
  if (err) {
    console.error("資料庫連線失敗：", err.message);
  } else {
    console.log("已連接 SQLite 資料庫 health.db");
  }
});

// 建立 health_logs 資料表
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

// 決策樹：依照睡眠、步數、心情分數判斷風險
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

// GET：取得所有健康日誌
app.get("/health-logs", (req, res) => {
  db.all("SELECT * FROM health_logs ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST：新增健康日誌
app.post("/health-logs", (req, res) => {
  const { log_date, sleep_hours, steps, mood_score } = req.body;

  if (!log_date || sleep_hours === undefined || steps === undefined || mood_score === undefined) {
    return res.status(400).json({ error: "請填寫完整資料" });
  }

  const risk_level = calculateRisk(
    Number(sleep_hours),
    Number(steps),
    Number(mood_score)
  );

  db.run(
    `
    INSERT INTO health_logs 
    (log_date, sleep_hours, steps, mood_score, risk_level)
    VALUES (?, ?, ?, ?, ?)
    `,
    [log_date, sleep_hours, steps, mood_score, risk_level],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({
        id: this.lastID,
        log_date,
        sleep_hours,
        steps,
        mood_score,
        risk_level
      });
    }
  );
});

// PUT：修改健康日誌
app.put("/health-logs/:id", (req, res) => {
  const { id } = req.params;
  const { log_date, sleep_hours, steps, mood_score } = req.body;

  if (!log_date || sleep_hours === undefined || steps === undefined || mood_score === undefined) {
    return res.status(400).json({ error: "請填寫完整資料" });
  }

  const risk_level = calculateRisk(
    Number(sleep_hours),
    Number(steps),
    Number(mood_score)
  );

  db.run(
    `
    UPDATE health_logs
    SET log_date = ?, sleep_hours = ?, steps = ?, mood_score = ?, risk_level = ?
    WHERE id = ?
    `,
    [log_date, sleep_hours, steps, mood_score, risk_level, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({
        message: "修改成功",
        id,
        log_date,
        sleep_hours,
        steps,
        mood_score,
        risk_level
      });
    }
  );
});

// DELETE：刪除健康日誌
app.delete("/health-logs/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM health_logs WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    res.json({ message: "刪除成功" });
  });
});

// GET：測試決策樹風險
app.get("/health-logs/risk", (req, res) => {
  const { sleep_hours, steps, mood_score } = req.query;

  if (sleep_hours === undefined || steps === undefined || mood_score === undefined) {
    return res.status(400).json({
      error: "請提供 sleep_hours、steps、mood_score"
    });
  }

  const risk_level = calculateRisk(
    Number(sleep_hours),
    Number(steps),
    Number(mood_score)
  );

  res.json({ risk_level });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器已啟動：http://localhost:${PORT}`);
});