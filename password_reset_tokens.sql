-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 09, 2025 at 06:57 PM
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
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `userId`, `token`, `expiresAt`, `used`, `createdAt`, `updatedAt`) VALUES
(1, 2, '2e3b22cf-bd49-4c28-bab6-b5c8dae9e217', '2025-07-09 15:41:42', 1, '2025-07-09 14:41:42', '2025-07-09 14:44:39'),
(2, 2, '7b4cf93b-9645-4d3b-bd99-72c07b07a95f', '2025-07-09 15:44:39', 1, '2025-07-09 14:44:39', '2025-07-09 14:45:13'),
(3, 6, 'a75c0a05-e1e3-4b6f-9f40-d55240c2442f', '2025-07-09 15:59:02', 1, '2025-07-09 14:59:02', '2025-07-09 15:00:14'),
(4, 6, '1d5e5b1d-aeff-4414-be4b-42d6cfc68f82', '2025-07-09 16:02:00', 1, '2025-07-09 15:02:00', '2025-07-09 15:19:09'),
(5, 4, '116b6302-f960-44d0-87a6-886d44aa965c', '2025-07-09 17:03:25', 1, '2025-07-09 16:03:25', '2025-07-09 16:04:33'),
(6, 4, '46e18310-972d-47b8-aa48-97bb7380ae36', '2025-07-09 17:04:33', 1, '2025-07-09 16:04:33', '2025-07-09 16:07:56'),
(7, 4, '8da37568-559f-42eb-81a7-51e7f5b5a117', '2025-07-09 17:07:56', 1, '2025-07-09 16:07:56', '2025-07-09 16:12:26'),
(8, 6, '8e4c1c93-d109-4ac9-b537-f2aad488a261', '2025-07-09 17:11:36', 0, '2025-07-09 16:11:36', '2025-07-09 16:11:36'),
(9, 4, '1b5d6fc3-5010-4f16-8dd3-761833f99770', '2025-07-09 17:12:26', 1, '2025-07-09 16:12:26', '2025-07-09 16:51:55'),
(10, 4, '667e89a7-e44e-4478-b021-657f02aa1dca', '2025-07-09 17:51:55', 0, '2025-07-09 16:51:55', '2025-07-09 16:51:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
