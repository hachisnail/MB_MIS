-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jun 24, 2025 at 04:31 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `museo_bulawan_logs`
--

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL,
  `action` enum('create','update','delete','soft_delete') NOT NULL,
  `model` varchar(50) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `description` longtext DEFAULT NULL,
  `beforeState` longtext DEFAULT NULL,
  `afterState` longtext DEFAULT NULL,
  `userId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `logs`
--

INSERT INTO `logs` (`id`, `action`, `model`, `details`, `description`, `beforeState`, `afterState`, `userId`, `createdAt`) VALUES
(0, 'update', 'User', '\"User logged out from IP: ::1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'User logout', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-24 02:00:35'),
(0, 'update', 'User', '\"User logged in from IP: ::1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'User login', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-24 02:01:33'),
(0, 'update', 'User', '\"User logged in from IP: ::1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'User login', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-24 02:07:56'),
(0, 'update', 'User', '\"User logged out from IP: ::ffff:127.0.0.1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'User logout', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-24 02:25:33'),
(0, 'update', 'User', '\"User logged in from IP: ::ffff:127.0.0.1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'User login', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-24 02:25:51'),
(0, 'update', 'User', '\"User logged out from IP: ::1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'User logout', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-24 02:28:37');

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `sessionId` varchar(255) NOT NULL,
  `loginAt` datetime NOT NULL DEFAULT current_timestamp(),
  `logoutAt` datetime DEFAULT NULL,
  `isOnline` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `userId`, `sessionId`, `loginAt`, `logoutAt`, `isOnline`) VALUES
(2, 1, 'FknwpvE5XoxyMs0rzIAE5JQXoJUwCsnr', '2025-05-21 19:00:23', '2025-05-21 19:00:26', 0),
(3, 2, 'X9QH9qtj-1mJ11alOUoCNGTrBiIpN62-', '2025-06-24 02:07:56', '2025-06-24 02:28:37', 0),
(4, 6, 'e2DuNe9wdnoSAlyki3ZJXeXfG0eha9Dz', '2025-06-24 02:25:51', NULL, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sessionId_UNIQUE` (`sessionId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
