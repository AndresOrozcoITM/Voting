-- init_db.sql

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS voting_db;
USE voting_db;

-- Crear la tabla de Votantes
CREATE TABLE IF NOT EXISTS Voters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  has_voted BOOLEAN DEFAULT false
);

-- Crear la tabla de Candidatos
CREATE TABLE IF NOT EXISTS Candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  party VARCHAR(255),
  votes INT DEFAULT 0
);

-- Crear la tabla de Votos
CREATE TABLE IF NOT EXISTS Votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voter_id INT,
  candidate_id INT,
  FOREIGN KEY (voter_id) REFERENCES Voters(id),
  FOREIGN KEY (candidate_id) REFERENCES Candidates(id)
);
