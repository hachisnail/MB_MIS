-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jun 29, 2025 at 11:40 AM
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
-- Database: `museo_bulawan_mis`
--

-- --------------------------------------------------------

--
-- Table structure for table `invitations`
--

CREATE TABLE `invitations` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `token` varchar(255) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `isUsed` tinyint(1) DEFAULT 0,
  `roleId` int(11) NOT NULL,
  `position` enum('Staff','ContentManager','Viewer','Reviewer','Admin') DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `role` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invitations`
--

INSERT INTO `invitations` (`id`, `email`, `first_name`, `last_name`, `contact_number`, `token`, `expiresAt`, `isUsed`, `roleId`, `position`, `createdAt`, `updatedAt`, `role`) VALUES
(3, 'jeff.jefferson.jt@gmail.com', 'Test', 'Sins', '09123245678', '53a35676-a3ea-49ac-80dc-bb84864df53f', '2025-06-18 02:23:25', 1, 0, NULL, '2025-06-11 02:23:25', '2025-06-11 03:26:51', 'Admin'),
(5, 'jeffersontalagtag06@gmail.com', 'Jeffereson ', 'Talagtag', '09054163430', '8aecf2ae-878b-4453-b95f-87a2136f96c8', '2025-06-20 06:55:23', 1, 0, NULL, '2025-06-13 02:57:20', '2025-06-14 13:27:20', 'Admin');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`) VALUES
(1, 'Admin'),
(2, 'ContentManager'),
(4, 'Reviewer'),
(3, 'Viewer');

-- --------------------------------------------------------

--
-- Table structure for table `router_flags`
--

CREATE TABLE `router_flags` (
  `id` int(11) NOT NULL,
  `route_key` varchar(255) NOT NULL,
  `is_enabled` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `router_flags`
--

INSERT INTO `router_flags` (`id`, `route_key`, `is_enabled`, `createdAt`, `updatedAt`) VALUES
(1, 'login', 1, '2025-06-09 12:52:19', '2025-06-24 00:29:49'),
(2, 'catalogs', 0, '2025-06-09 12:52:19', '2025-06-09 04:52:33'),
(3, 'home', 1, '2025-06-09 12:52:19', '2025-06-09 12:52:19'),
(5, 'inventory', 1, '2025-06-09 12:52:19', '2025-06-14 13:35:48'),
(6, 'acquisition', 1, '2025-06-09 12:52:19', '2025-06-26 04:35:37'),
(7, 'schedule', 1, '2025-06-09 12:52:19', '2025-06-24 01:38:01'),
(8, 'article', 1, '2025-06-09 12:52:19', '2025-06-26 04:40:39'),
(9, 'appointment', 1, '2025-06-09 12:52:19', '2025-06-28 16:09:04'),
(10, 'sandbox', 1, '2025-06-09 12:52:19', '2025-06-26 04:36:03'),
(11, 'logs', 1, '2025-06-09 12:52:19', '2025-06-27 01:39:10'),
(12, 'user', 1, '2025-06-09 12:52:19', '2025-06-26 04:46:37'),
(13, 'down', 0, '0000-00-00 00:00:00', '2025-06-26 06:18:20');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `sid` varchar(36) NOT NULL,
  `expires` datetime DEFAULT NULL,
  `data` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`sid`, `expires`, `data`, `createdAt`, `updatedAt`) VALUES
('VQxVPKkBuBzbhdPvx8f7Syx3mzOa4Rj4', '2025-06-30 09:38:02', '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-06-30T04:08:30.686Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":6,\"user\":{\"id\":6,\"username\":\"hachisnail\",\"fname\":\"Jefferson \",\"lname\":\"Talagtag\",\"email\":\"jeffersontalagtag06@gmail.com\",\"roleId\":1,\"position\":\"System Administrator\"}}', '2025-06-29 04:08:30', '2025-06-29 09:38:02');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fname` varchar(50) DEFAULT NULL,
  `lname` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `contact` varchar(20) DEFAULT NULL,
  `roleId` int(11) DEFAULT NULL,
  `position` char(50) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `fname`, `lname`, `email`, `contact`, `roleId`, `position`, `createdAt`, `updatedAt`) VALUES
(1, 'system', '$2a$10$X2eQbE6n3fOQgTmkEoO8VOra9NxYFiW0X3ExL1cOARfV5acFPv2Py', 'System', 'Account', 'system@yourapp.com', '', 1, 'System', '2025-06-24 09:22:06', '2025-06-24 09:22:06'),
(2, 'renz', '$2a$10$HGZGUkRMt/qdhLp.wzE6j.eW9ajXk127zo5PL26MU9GHpVUY/tGA6', 'Renz', 'Labayan', 'labayanrenz@gmail.com', NULL, 1, 'Staff', '2025-05-22 02:45:01', '2025-05-22 02:45:01'),
(3, 'jeff', '$2a$10$DG3E/ijj2AhdHgVjp6KwMujqExMLVeP5VwTHa7KJelSf5sMjwoB.a', 'Test', 'Sins', 'jeff.jefferson.jt@gmail.com', '09123245678', 4, 'Tester', '2025-06-11 03:26:51', '2025-06-11 03:26:51'),
(4, 'test', '$2b$10$QtC90.XBzFvttptxDAGUmu2vWrVim32o8lzpgwr7PE8I1YZLEMqtO', 'Johnny', 'Sins', 'jeffersontalagtag06@yahoo.com', '09054163430', NULL, 'Tester', '2025-06-11 03:30:33', '2025-06-11 03:30:33'),
(6, 'hachisnail', '$2b$10$8g6DrNf6AqIKT7lbXKDZt..rHshc0exefPrLO46JNza2dmgixYsVW', 'Jefferson', 'Talagtag', 'jeffersontalagtag06@gmail.com', '09054163430', 1, 'System Administrator', '2025-06-14 13:27:20', '2025-06-14 13:27:20');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `invitations`
--
ALTER TABLE `invitations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `router_flags`
--
ALTER TABLE `router_flags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `route_key` (`route_key`),
  ADD UNIQUE KEY `router_flags_route_key` (`route_key`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`sid`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `roleId` (`roleId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `invitations`
--
ALTER TABLE `invitations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `router_flags`
--
ALTER TABLE `router_flags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
