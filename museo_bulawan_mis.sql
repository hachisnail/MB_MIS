-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jun 14, 2025 at 03:33 PM
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
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL,
  `action` enum('create','update','delete','soft_delete') NOT NULL,
  `model` varchar(50) NOT NULL,
  `modelId` int(11) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `userId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(1, 'login', 1, '2025-06-09 12:52:19', '2025-06-09 12:52:19'),
(2, 'catalogs', 0, '2025-06-09 12:52:19', '2025-06-09 04:52:33'),
(3, 'home', 1, '2025-06-09 12:52:19', '2025-06-09 12:52:19'),
(4, 'dashboard', 1, '2025-06-09 12:52:19', '2025-06-09 14:45:00'),
(5, 'inventory', 1, '2025-06-09 12:52:19', '2025-06-09 14:36:47'),
(6, 'acquisition', 1, '2025-06-09 12:52:19', '2025-06-09 12:52:19'),
(7, 'schedule', 1, '2025-06-09 12:52:19', '2025-06-09 12:52:19'),
(8, 'article', 1, '2025-06-09 12:52:19', '2025-06-09 12:52:19'),
(9, 'appointment', 1, '2025-06-09 12:52:19', '2025-06-10 10:33:52'),
(10, 'sandbox', 1, '2025-06-09 12:52:19', '2025-06-09 12:52:19'),
(11, 'logs', 1, '2025-06-09 12:52:19', '2025-06-09 14:59:23'),
(12, 'user', 1, '2025-06-09 12:52:19', '2025-06-09 14:59:27');

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
('2uoO2Q2AkavYl22syYK4tcUuzXyHjCiC', '2025-06-15 13:32:36', '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-06-15T13:28:11.372Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":6,\"user\":{\"id\":6,\"username\":\"hachisnail\",\"fname\":\"Jeffereson \",\"lname\":\"Talagtag\",\"email\":\"jeffersontalagtag06@gmail.com\",\"roleId\":1,\"position\":\"System Administrator\"}}', '2025-06-14 13:28:11', '2025-06-14 13:32:36');

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
(2, 'renz', '$2a$10$HGZGUkRMt/qdhLp.wzE6j.eW9ajXk127zo5PL26MU9GHpVUY/tGA6', 'Renz', 'Labayan', 'labayanrenz@gmail.com', NULL, 1, 'Staff', '2025-05-22 02:45:01', '2025-05-22 02:45:01'),
(3, 'jeff', '$2b$10$6jk2DAgyX5RR/aczH3dH..AqTNY9Q310L/shTQ4eQPmqLWMGQBvjq', 'Test', 'Sins', 'jeff.jefferson.jt@gmail.com', '09123245678', 1, 'Tester', '2025-06-11 03:26:51', '2025-06-11 03:26:51'),
(4, 'test', '$2b$10$QtC90.XBzFvttptxDAGUmu2vWrVim32o8lzpgwr7PE8I1YZLEMqtO', 'Johnny', 'Sins', 'jeffersontalagtag06@yahoo.com', '09054163430', NULL, 'Tester', '2025-06-11 03:30:33', '2025-06-11 03:30:33'),
(6, 'hachisnail', '$2b$10$8g6DrNf6AqIKT7lbXKDZt..rHshc0exefPrLO46JNza2dmgixYsVW', 'Jeffereson', 'Talagtag', 'jeffersontalagtag06@gmail.com', '09054163430', 1, 'System Administrator', '2025-06-14 13:27:20', '2025-06-14 13:27:20');

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
(4, 2, 'J3FYIlZXQkVGMXzUI6xHy8oCrCd4x7yE', '2025-06-09 14:20:58', '2025-06-09 14:21:17', 0),
(5, 2, 'TsUvVXRmLJG5M_rhGUJFkzYYXtMMIYRi', '2025-06-09 14:22:01', '2025-06-09 14:23:02', 0),
(6, 2, 'yWVAk-Nj_3HMAqYdyLjfghvcCApIEyhW', '2025-06-09 14:24:03', '2025-06-09 14:24:13', 0),
(7, 2, 'lFSA7uoASCr7yFuph5tYijzOxkmxBdIa', '2025-06-09 14:33:36', '2025-06-09 14:33:46', 0),
(8, 2, 'wjiFttlxyoyfT4AdHtc8v9E9rdRjnnM5', '2025-06-09 14:34:31', '2025-06-09 14:44:00', 0),
(9, 2, 'MaucYuHhhPiXftssZH6vzHQF3ZNlP7oX', '2025-06-09 14:44:11', '2025-06-09 14:44:42', 0),
(10, 2, '3gzRnKHZX4gTuJnK5TMTB_ubeAfg-CH-', '2025-06-09 14:44:42', '2025-06-09 14:45:08', 0),
(11, 2, 'hGSn8XFFPu_oDTnget1M2wokYfzrKxjo', '2025-06-09 14:46:10', '2025-06-09 14:47:43', 0),
(13, 2, 'QQf7xobuZm-HpCqvJQRDIf9uJmEZuW4-', '2025-06-09 14:48:32', '2025-06-09 14:48:38', 0),
(14, 2, 'z2vZunRBo9RPZMN9sUdtgqQZln_Mk2sT', '2025-06-09 14:48:45', '2025-06-09 14:50:51', 0),
(16, 2, 'JfbofVNIEqNuW4fG1_dfvAyDOVigQh4G', '2025-06-09 14:50:56', '2025-06-09 14:51:00', 0),
(17, 2, 'l7GuwRj1_7nZbP5XN0EytcO03CSAu6JR', '2025-06-09 14:51:08', '2025-06-09 14:53:41', 0),
(18, 2, 'zypVBxZrKhkuTZwoCNIdSWghV0GBgVSo', '2025-06-09 14:53:47', '2025-06-09 14:54:29', 0),
(19, 2, 'g7JAL4Tci0Id4asbodRSmpR70d-1iAxz', '2025-06-09 14:54:40', '2025-06-09 14:54:42', 0),
(20, 2, '-CPLJH7YPW1gbn2yU2UxxW1Dy9ZmRzkr', '2025-06-09 14:54:48', '2025-06-09 14:58:24', 0),
(21, 2, 'lvAT7aEZn1ZsaM1yJlxgCZ3lsFKhQt7k', '2025-06-09 14:58:28', '2025-06-09 14:59:05', 0),
(22, 2, '2llr5Zz8JtF5hmqh1UMGWiIGtgJ9a17y', '2025-06-09 14:59:11', '2025-06-09 15:00:18', 0),
(23, 2, 'nWTtGbHy2vINmicJp5hP1Y5irznYklkP', '2025-06-09 16:06:32', '2025-06-09 16:06:36', 0),
(25, 2, 'Ke8E1_HBNqSnUsMmHzsmmuiAzEqj1QLz', '2025-06-09 16:07:27', '2025-06-09 16:07:33', 0),
(29, 2, 'pDf1_AiAddeaIP3uJN8KmwlsC_sts79G', '2025-06-10 10:04:12', '2025-06-10 10:04:23', 0),
(34, 2, 'ldV1a1FV5T9JUhQuNe-v-issuusuvAg7', '2025-06-13 02:56:14', '2025-06-14 13:24:31', 0),
(35, 2, '-JZSxSGleLIZ8Ks4P6OyMgYvEUpIRTdQ', '2025-06-14 13:24:31', '2025-06-14 13:25:43', 0),
(36, 6, 'xdCmxaPYNf0OyixO6LTVpIYXR3_dzodh', '2025-06-14 13:27:28', '2025-06-14 13:28:06', 0),
(37, 6, '2uoO2Q2AkavYl22syYK4tcUuzXyHjCiC', '2025-06-14 13:28:11', NULL, 1);

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
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

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
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sessionId` (`sessionId`),
  ADD KEY `userId` (`userId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `invitations`
--
ALTER TABLE `invitations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `router_flags`
--
ALTER TABLE `router_flags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `logs`
--
ALTER TABLE `logs`
  ADD CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
