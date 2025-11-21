CREATE DATABASE IF NOT EXISTS vitalview;
USE vitalview;

CREATE TABLE IF NOT EXISTS vitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hr INT,
    pulse INT,
    spo2 INT,
    abp VARCHAR(20),
    pap VARCHAR(20),
    etco2 INT,
    awrr INT,
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
