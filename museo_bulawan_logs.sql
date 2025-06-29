-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jun 29, 2025 at 11:39 AM
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
  `action` enum('create','update','delete','soft_delete','login','logout') NOT NULL,
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
(1, 'logout', 'User', '\"User logged out from IP: ::1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'User logout', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-24 02:00:35'),
(2, 'login', 'User', '\"User logged in from IP: ::1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'User login', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-24 02:01:33'),
(3, 'login', 'User', '\"User logged in from IP: ::1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'User login', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-24 02:07:56'),
(4, 'logout', 'User', '\"User logged out from IP: ::ffff:127.0.0.1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'User logout', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-24 02:25:33'),
(5, 'login', 'User', '\"User logged in from IP: ::ffff:127.0.0.1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'User login', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-24 02:25:51'),
(6, 'logout', 'User', '\"User logged out from IP: ::1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'User logout', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-24 02:28:37'),
(7, 'logout', 'User', '\"User logged out from IP: ::ffff:127.0.0.1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'User logout', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-24 03:05:16'),
(8, 'login', 'User', '\"User logged in from IP: ::ffff:127.0.0.1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'User login', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-24 03:05:21'),
(9, 'create', 'Invitation', '{\"new\":{\"isUsed\":false,\"id\":9,\"email\":\"test@email.cpm\",\"first_name\":\"again\",\"last_name\":\"test\",\"contact_number\":\"09123456789\",\"token\":\"492e137b-b271-459a-b463-a79b5131513a\",\"expiresAt\":\"2025-07-01T03:06:12.982Z\",\"role\":\"Viewer\",\"position\":null,\"updatedAt\":\"2025-06-24T03:06:12.983Z\",\"createdAt\":\"2025-06-24T03:06:12.983Z\"},\"message\":\"Invitation created for test@email.cpm\"}', 'Created invitation for test@email.cpm', NULL, '{\"isUsed\":false,\"id\":9,\"email\":\"test@email.cpm\",\"first_name\":\"again\",\"last_name\":\"test\",\"contact_number\":\"09123456789\",\"token\":\"492e137b-b271-459a-b463-a79b5131513a\",\"expiresAt\":\"2025-07-01T03:06:12.982Z\",\"role\":\"Viewer\",\"position\":null,\"updatedAt\":\"2025-06-24T03:06:12.983Z\",\"createdAt\":\"2025-06-24T03:06:12.983Z\"}', 6, '2025-06-24 03:06:15'),
(10, 'update', 'Invitation', '{\"previous\":{\"id\":9,\"email\":\"test@email.cpm\",\"first_name\":\"again\",\"last_name\":\"test\",\"contact_number\":\"09123456789\",\"token\":\"492e137b-b271-459a-b463-a79b5131513a\",\"expiresAt\":\"2025-07-01T03:06:12.000Z\",\"isUsed\":false,\"role\":\"Viewer\",\"position\":null,\"createdAt\":\"2025-06-24T03:06:12.000Z\",\"updatedAt\":\"2025-06-24T03:06:12.000Z\"},\"new\":{\"id\":9,\"email\":\"test@email.cpm\",\"first_name\":\"again\",\"last_name\":\"test\",\"contact_number\":\"09123456789\",\"token\":\"0b293002-0e56-42a8-8c72-948b0ac5a812\",\"expiresAt\":\"2025-07-01T03:06:28.420Z\",\"isUsed\":false,\"role\":\"Viewer\",\"position\":null,\"createdAt\":\"2025-06-24T03:06:12.000Z\",\"updatedAt\":\"2025-06-24T03:06:28.421Z\"},\"message\":\"Invitation for test@email.cpm was resent\"}', 'Resent invitation to test@email.cpm', '{\"id\":9,\"email\":\"test@email.cpm\",\"first_name\":\"again\",\"last_name\":\"test\",\"contact_number\":\"09123456789\",\"token\":\"492e137b-b271-459a-b463-a79b5131513a\",\"expiresAt\":\"2025-07-01T03:06:12.000Z\",\"isUsed\":false,\"role\":\"Viewer\",\"position\":null,\"createdAt\":\"2025-06-24T03:06:12.000Z\",\"updatedAt\":\"2025-06-24T03:06:12.000Z\"}', '{\"id\":9,\"email\":\"test@email.cpm\",\"first_name\":\"again\",\"last_name\":\"test\",\"contact_number\":\"09123456789\",\"token\":\"0b293002-0e56-42a8-8c72-948b0ac5a812\",\"expiresAt\":\"2025-07-01T03:06:28.420Z\",\"isUsed\":false,\"role\":\"Viewer\",\"position\":null,\"createdAt\":\"2025-06-24T03:06:12.000Z\",\"updatedAt\":\"2025-06-24T03:06:28.421Z\"}', 6, '2025-06-24 03:06:31'),
(11, 'delete', 'Invitation', '{\"previous\":{\"id\":9,\"email\":\"test@email.cpm\",\"first_name\":\"again\",\"last_name\":\"test\",\"contact_number\":\"09123456789\",\"token\":\"0b293002-0e56-42a8-8c72-948b0ac5a812\",\"expiresAt\":\"2025-07-01T03:06:28.000Z\",\"isUsed\":false,\"role\":\"Viewer\",\"position\":null,\"createdAt\":\"2025-06-24T03:06:12.000Z\",\"updatedAt\":\"2025-06-24T03:06:28.000Z\"},\"message\":\"Invitation for test@email.cpm permanently revoked\"}', 'Revoked invitation for test@email.cpm', '{\"id\":9,\"email\":\"test@email.cpm\",\"first_name\":\"again\",\"last_name\":\"test\",\"contact_number\":\"09123456789\",\"token\":\"0b293002-0e56-42a8-8c72-948b0ac5a812\",\"expiresAt\":\"2025-07-01T03:06:28.000Z\",\"isUsed\":false,\"role\":\"Viewer\",\"position\":null,\"createdAt\":\"2025-06-24T03:06:12.000Z\",\"updatedAt\":\"2025-06-24T03:06:28.000Z\"}', NULL, 6, '2025-06-24 03:06:38'),
(12, 'create', 'Invitation', '{\"new\":{\"isUsed\":false,\"id\":10,\"email\":\"test@sasdasd.asd\",\"first_name\":\"test\",\"last_name\":\"ing\",\"contact_number\":\"09123456789\",\"token\":\"a1d1e936-948c-476d-821f-87e359edfb4f\",\"expiresAt\":\"2025-07-01T03:19:19.010Z\",\"role\":\"Viewer\",\"position\":null,\"updatedAt\":\"2025-06-24T03:19:19.013Z\",\"createdAt\":\"2025-06-24T03:19:19.013Z\"},\"message\":\"hachisnail has created an invitation for test@sasdasd.asd.\"}', 'hachisnail created an invitation for test@sasdasd.asd', NULL, '{\"isUsed\":false,\"id\":10,\"email\":\"test@sasdasd.asd\",\"first_name\":\"test\",\"last_name\":\"ing\",\"contact_number\":\"09123456789\",\"token\":\"a1d1e936-948c-476d-821f-87e359edfb4f\",\"expiresAt\":\"2025-07-01T03:19:19.010Z\",\"role\":\"Viewer\",\"position\":null,\"updatedAt\":\"2025-06-24T03:19:19.013Z\",\"createdAt\":\"2025-06-24T03:19:19.013Z\"}', 6, '2025-06-24 03:19:22'),
(13, 'update', 'User', '\"User logged in from IP: ::1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'User login', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-24 03:22:29'),
(14, 'delete', 'Invitation', '{\"previous\":{\"id\":10,\"email\":\"test@sasdasd.asd\",\"first_name\":\"test\",\"last_name\":\"ing\",\"contact_number\":\"09123456789\",\"token\":\"a1d1e936-948c-476d-821f-87e359edfb4f\",\"expiresAt\":\"2025-07-01T03:19:19.000Z\",\"isUsed\":false,\"role\":\"Viewer\",\"position\":null,\"createdAt\":\"2025-06-24T03:19:19.000Z\",\"updatedAt\":\"2025-06-24T03:19:19.000Z\"},\"message\":\"renz has permanently revoked the invitation for test@sasdasd.asd.\"}', 'renz revoked an invitation for test@sasdasd.asd', '{\"id\":10,\"email\":\"test@sasdasd.asd\",\"first_name\":\"test\",\"last_name\":\"ing\",\"contact_number\":\"09123456789\",\"token\":\"a1d1e936-948c-476d-821f-87e359edfb4f\",\"expiresAt\":\"2025-07-01T03:19:19.000Z\",\"isUsed\":false,\"role\":\"Viewer\",\"position\":null,\"createdAt\":\"2025-06-24T03:19:19.000Z\",\"updatedAt\":\"2025-06-24T03:19:19.000Z\"}', NULL, 2, '2025-06-24 03:22:34'),
(15, 'update', 'User', '\"User logged out from IP: ::1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'User logout', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-24 03:23:24'),
(16, 'update', 'User', '\"User logged in from IP: ::1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'User login', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-24 03:27:02'),
(17, 'update', 'User', '\"User logged out from IP: ::1, UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'User logout', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-24 03:27:09'),
(18, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Renz Labayan (renz) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-24 03:29:34'),
(19, 'logout', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Renz Labayan (renz) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-24 03:29:43'),
(20, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Renz Labayan (renz) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-24 03:33:20'),
(21, 'logout', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Renz Labayan (renz) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-24 03:37:45'),
(22, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jeffereson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-24 05:58:26'),
(23, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jeffereson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-25 00:07:08'),
(24, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Test Sins (jeff) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 3, '2025-06-25 01:15:47'),
(25, 'logout', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Test Sins (jeff) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 3, '2025-06-25 01:16:36'),
(26, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jeffereson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-25 02:00:18'),
(27, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jeffereson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 04:25:08'),
(28, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was disabled by hachisnail\"', 'Router flag \"acquisition\" disabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-09T12:52:19.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:31:52.258Z\"}', 6, '2025-06-26 04:31:52'),
(29, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was enabled by hachisnail\"', 'Router flag \"acquisition\" enabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:31:52.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:31:53.889Z\"}', 6, '2025-06-26 04:31:53'),
(30, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was disabled by hachisnail\"', 'Router flag \"acquisition\" disabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:31:53.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:31:54.817Z\"}', 6, '2025-06-26 04:31:54'),
(31, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was enabled by hachisnail\"', 'Router flag \"acquisition\" enabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:31:54.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:31:55.596Z\"}', 6, '2025-06-26 04:31:55'),
(32, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was disabled by hachisnail\"', 'Router flag \"acquisition\" disabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:31:55.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:31:59.462Z\"}', 6, '2025-06-26 04:31:59'),
(33, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was enabled by hachisnail\"', 'Router flag \"acquisition\" enabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:31:59.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:32:00.265Z\"}', 6, '2025-06-26 04:32:00'),
(34, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was disabled by hachisnail\"', 'Router flag \"acquisition\" disabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:32:00.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:32:01.133Z\"}', 6, '2025-06-26 04:32:01'),
(35, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was enabled by hachisnail\"', 'Router flag \"acquisition\" enabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:32:01.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:32:03.606Z\"}', 6, '2025-06-26 04:32:03'),
(36, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was disabled by hachisnail\"', 'Router flag \"acquisition\" disabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:32:03.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:34:09.934Z\"}', 6, '2025-06-26 04:34:09'),
(37, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was enabled by hachisnail\"', 'Router flag \"acquisition\" enabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:34:09.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:34:11.154Z\"}', 6, '2025-06-26 04:34:11'),
(38, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was disabled by hachisnail\"', 'Router flag \"acquisition\" disabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:34:11.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:34:11.975Z\"}', 6, '2025-06-26 04:34:11'),
(39, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was enabled by hachisnail\"', 'Router flag \"acquisition\" enabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:34:11.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:34:12.725Z\"}', 6, '2025-06-26 04:34:12'),
(40, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was disabled by hachisnail\"', 'Router flag \"acquisition\" disabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:34:12.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:35:34.365Z\"}', 6, '2025-06-26 04:35:34'),
(41, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was enabled by hachisnail\"', 'Router flag \"acquisition\" enabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:35:34.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:35:35.249Z\"}', 6, '2025-06-26 04:35:35'),
(42, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was disabled by hachisnail\"', 'Router flag \"acquisition\" disabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:35:35.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:35:36.177Z\"}', 6, '2025-06-26 04:35:36'),
(43, 'update', 'RouterFlag', '\"Flag \\\"acquisition\\\" was enabled by hachisnail\"', 'Router flag \"acquisition\" enabled', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:35:36.000Z\"}', '{\"id\":6,\"route_key\":\"acquisition\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:35:37.670Z\"}', 6, '2025-06-26 04:35:37'),
(44, 'update', 'RouterFlag', '\"Flag \\\"sandbox\\\" was disabled by hachisnail\"', 'Router flag \"sandbox\" disabled', '{\"id\":10,\"route_key\":\"sandbox\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-24T00:29:53.000Z\"}', '{\"id\":10,\"route_key\":\"sandbox\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:36:03.559Z\"}', 6, '2025-06-26 04:36:03'),
(45, 'update', 'RouterFlag', '\"Flag \\\"article\\\" was disabled by hachisnail\"', 'Router flag \"article\" disabled', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-09T12:52:19.000Z\"}', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:21.480Z\"}', 6, '2025-06-26 04:40:21'),
(46, 'update', 'RouterFlag', '\"Flag \\\"article\\\" was enabled by hachisnail\"', 'Router flag \"article\" enabled', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:21.000Z\"}', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:22.858Z\"}', 6, '2025-06-26 04:40:22'),
(47, 'update', 'RouterFlag', '\"Flag \\\"article\\\" was disabled by hachisnail\"', 'Router flag \"article\" disabled', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:22.000Z\"}', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:24.132Z\"}', 6, '2025-06-26 04:40:24'),
(48, 'update', 'RouterFlag', '\"Flag \\\"article\\\" was enabled by hachisnail\"', 'Router flag \"article\" enabled', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:24.000Z\"}', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:35.576Z\"}', 6, '2025-06-26 04:40:35'),
(49, 'update', 'RouterFlag', '\"Flag \\\"article\\\" was disabled by hachisnail\"', 'Router flag \"article\" disabled', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:35.000Z\"}', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:36.979Z\"}', 6, '2025-06-26 04:40:36'),
(50, 'update', 'RouterFlag', '\"Flag \\\"article\\\" was enabled by hachisnail\"', 'Router flag \"article\" enabled', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:36.000Z\"}', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:37.882Z\"}', 6, '2025-06-26 04:40:37'),
(51, 'update', 'RouterFlag', '\"Flag \\\"article\\\" was disabled by hachisnail\"', 'Router flag \"article\" disabled', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:37.000Z\"}', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:38.877Z\"}', 6, '2025-06-26 04:40:38'),
(52, 'update', 'RouterFlag', '\"Flag \\\"article\\\" was enabled by hachisnail\"', 'Router flag \"article\" enabled', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:38.000Z\"}', '{\"id\":8,\"route_key\":\"article\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:40:39.924Z\"}', 6, '2025-06-26 04:40:39'),
(53, 'update', 'RouterFlag', '\"Flag \\\"logs\\\" was disabled by hachisnail\"', 'Router flag \"logs\" disabled', '{\"id\":11,\"route_key\":\"logs\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-09T14:59:23.000Z\"}', '{\"id\":11,\"route_key\":\"logs\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:42:40.191Z\"}', 6, '2025-06-26 04:42:40'),
(54, 'update', 'RouterFlag', '\"Flag \\\"logs\\\" was enabled by hachisnail\"', 'Router flag \"logs\" enabled', '{\"id\":11,\"route_key\":\"logs\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:42:40.000Z\"}', '{\"id\":11,\"route_key\":\"logs\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:42:42.038Z\"}', 6, '2025-06-26 04:42:42'),
(55, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Renz Labayan (renz) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-26 04:46:19'),
(56, 'update', 'RouterFlag', '\"Flag \\\"user\\\" was disabled by renz\"', 'Router flag \"user\" disabled', '{\"id\":12,\"route_key\":\"user\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-09T14:59:27.000Z\"}', '{\"id\":12,\"route_key\":\"user\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:46:33.416Z\"}', 2, '2025-06-26 04:46:33'),
(57, 'update', 'RouterFlag', '\"Flag \\\"user\\\" was enabled by renz\"', 'Router flag \"user\" enabled', '{\"id\":12,\"route_key\":\"user\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:46:33.000Z\"}', '{\"id\":12,\"route_key\":\"user\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:46:37.136Z\"}', 2, '2025-06-26 04:46:37'),
(58, 'logout', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Renz Labayan (renz) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-26 04:46:43'),
(59, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Renz Labayan (renz) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-26 06:14:50'),
(60, 'logout', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Renz Labayan (renz) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-26 06:15:06'),
(61, 'update', 'RouterFlag', '\"Flag \\\"down\\\" was enabled by hachisnail\"', 'Router flag \"down\" enabled', '{\"id\":13,\"route_key\":\"down\",\"is_enabled\":false,\"createdAt\":null,\"updatedAt\":null}', '{\"id\":13,\"route_key\":\"down\",\"is_enabled\":true,\"createdAt\":null,\"updatedAt\":\"2025-06-26T06:18:19.239Z\"}', 6, '2025-06-26 06:18:19'),
(62, 'update', 'RouterFlag', '\"Flag \\\"down\\\" was disabled by hachisnail\"', 'Router flag \"down\" disabled', '{\"id\":13,\"route_key\":\"down\",\"is_enabled\":true,\"createdAt\":null,\"updatedAt\":\"2025-06-26T06:18:19.000Z\"}', '{\"id\":13,\"route_key\":\"down\",\"is_enabled\":false,\"createdAt\":null,\"updatedAt\":\"2025-06-26T06:18:20.225Z\"}', 6, '2025-06-26 06:18:20'),
(63, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Renz Labayan (renz) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-26 06:46:02'),
(64, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Renz Labayan (renz) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-26 06:46:32'),
(65, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Renz Labayan (renz) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-26 06:49:06'),
(66, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 06:53:03'),
(67, 'logout', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-26 06:53:11'),
(68, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Renz Labayan (renz) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-26 06:56:43'),
(69, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 06:59:30'),
(70, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-26 06:59:36'),
(71, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 06:59:43'),
(72, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-26 06:59:53'),
(73, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 07:19:46'),
(74, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 07:20:48'),
(75, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 07:20:57'),
(76, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 07:27:10'),
(77, 'logout', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-26 07:27:28'),
(78, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 07:37:05'),
(79, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 07:37:09'),
(80, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 07:41:35'),
(81, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 07:42:07'),
(82, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 07:45:40'),
(83, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-26 07:45:46'),
(84, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 07:45:56'),
(85, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-26 07:46:15'),
(86, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 07:46:18'),
(87, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-26 07:53:29'),
(88, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-26 07:53:31'),
(89, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-26 07:57:09'),
(90, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Renz Labayan (renz) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-26 07:57:14'),
(91, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Renz Labayan (renz) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-26 07:59:20'),
(92, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-27 01:36:52'),
(93, 'update', 'RouterFlag', '\"Flag \\\"logs\\\" was disabled by hachisnail\"', 'Router flag \"logs\" disabled', '{\"id\":11,\"route_key\":\"logs\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-26T04:42:42.000Z\"}', '{\"id\":11,\"route_key\":\"logs\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-27T01:39:06.603Z\"}', 6, '2025-06-27 01:39:06'),
(94, 'update', 'RouterFlag', '\"Flag \\\"logs\\\" was enabled by hachisnail\"', 'Router flag \"logs\" enabled', '{\"id\":11,\"route_key\":\"logs\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-27T01:39:06.000Z\"}', '{\"id\":11,\"route_key\":\"logs\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-27T01:39:07.799Z\"}', 6, '2025-06-27 01:39:07'),
(95, 'update', 'RouterFlag', '\"Flag \\\"logs\\\" was disabled by hachisnail\"', 'Router flag \"logs\" disabled', '{\"id\":11,\"route_key\":\"logs\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-27T01:39:07.000Z\"}', '{\"id\":11,\"route_key\":\"logs\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-27T01:39:09.101Z\"}', 6, '2025-06-27 01:39:09'),
(96, 'update', 'RouterFlag', '\"Flag \\\"logs\\\" was enabled by hachisnail\"', 'Router flag \"logs\" enabled', '{\"id\":11,\"route_key\":\"logs\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-27T01:39:09.000Z\"}', '{\"id\":11,\"route_key\":\"logs\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-27T01:39:10.533Z\"}', 6, '2025-06-27 01:39:10'),
(97, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-27 01:45:02'),
(98, 'login', 'User', '\"IP: ::1, User-Agent: PostmanRuntime/7.39.1\"', 'Renz Labayan (renz) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-27 01:48:28'),
(99, 'logout', 'User', '\"IP: ::1, User-Agent: PostmanRuntime/7.39.1\"', 'Renz Labayan (renz) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-27 01:48:45'),
(100, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-27 01:48:52'),
(101, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Renz Labayan (renz) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-28 14:43:50'),
(102, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Renz Labayan (renz) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-28 15:36:06'),
(103, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-28 15:39:50'),
(104, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-28 15:39:57'),
(105, 'logout', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-28 15:42:30'),
(106, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-28 15:42:41'),
(107, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-28 15:43:15'),
(108, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\"', 'Renz Labayan (renz) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 2, '2025-06-28 16:06:21'),
(109, 'logout', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\"', 'Renz Labayan (renz) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 2, '2025-06-28 16:06:30'),
(110, 'logout', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-28 16:06:37'),
(111, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-28 16:08:54'),
(112, 'update', 'RouterFlag', '\"Flag \\\"appointment\\\" was disabled by hachisnail\"', 'Router flag \"appointment\" disabled', '{\"id\":9,\"route_key\":\"appointment\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-10T10:33:52.000Z\"}', '{\"id\":9,\"route_key\":\"appointment\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-28T16:09:03.206Z\"}', 6, '2025-06-28 16:09:03'),
(113, 'update', 'RouterFlag', '\"Flag \\\"appointment\\\" was enabled by hachisnail\"', 'Router flag \"appointment\" enabled', '{\"id\":9,\"route_key\":\"appointment\",\"is_enabled\":false,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-28T16:09:03.000Z\"}', '{\"id\":9,\"route_key\":\"appointment\",\"is_enabled\":true,\"createdAt\":\"2025-06-09T12:52:19.000Z\",\"updatedAt\":\"2025-06-28T16:09:04.972Z\"}', 6, '2025-06-28 16:09:04'),
(114, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-28 16:16:10'),
(115, 'logout', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-28 16:17:20'),
(116, 'login', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-28 16:27:15'),
(117, 'logout', 'User', '\"IP: ::1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-28 16:27:20'),
(118, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-28 16:27:20'),
(119, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-28 16:30:35'),
(120, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-28 16:32:11'),
(121, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-28 17:04:07'),
(122, 'logout', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 6, '2025-06-28 20:02:22'),
(123, 'login', 'User', '\"IP: ::ffff:127.0.0.1, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0\"', 'Jefferson  Talagtag (hachisnail) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 6, '2025-06-29 04:08:30'),
(124, 'login', 'User', '\"IP: ::1, User-Agent: PostmanRuntime/7.39.1\"', 'Test Sins (jeff) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 3, '2025-06-29 05:56:40'),
(125, 'logout', 'User', '\"IP: ::1, User-Agent: PostmanRuntime/7.39.1\"', 'Test Sins (jeff) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 3, '2025-06-29 06:01:23'),
(126, 'login', 'User', '\"IP: ::1, User-Agent: PostmanRuntime/7.39.1\"', 'Test Sins (jeff) logged in', '{\"isOnline\":false}', '{\"isOnline\":true}', 3, '2025-06-29 06:01:36'),
(127, 'logout', 'User', '\"IP: ::1, User-Agent: PostmanRuntime/7.39.1\"', 'Test Sins (jeff) logged out', '{\"isOnline\":true}', '{\"isOnline\":false}', 3, '2025-06-29 06:07:10');

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
(4, 6, 'e2DuNe9wdnoSAlyki3ZJXeXfG0eha9Dz', '2025-06-24 02:25:51', '2025-06-24 03:05:16', 0),
(5, 6, 'A_SiFQUgoYS-2HCph1iPbTRyr4Y00T4N', '2025-06-24 03:05:21', '2025-06-24 05:58:26', 0),
(6, 2, '7tDB_SjrU28UtK2Omv8QcCCayNhMhbpJ', '2025-06-24 03:22:29', '2025-06-24 03:23:24', 0),
(7, 2, '1BN2a6HENLNjjyUeItk3z_wZm5S1C2bx', '2025-06-24 03:27:02', '2025-06-24 03:27:09', 0),
(8, 2, 'RARWXkpfLH6wrd1Msu01K4tOnzYk1F2M', '2025-06-24 03:29:33', '2025-06-24 03:29:43', 0),
(9, 2, 'k21NqqHbTpLHyJFnWo0YOOJKT4qn2YvS', '2025-06-24 03:33:20', '2025-06-24 03:37:45', 0),
(10, 6, 'D6iM7RnrxdAHqnhwxbqor7JDUrDK6n7r', '2025-06-25 00:07:08', '2025-06-25 02:00:18', 0),
(11, 3, '9b8F68nXu22KXrsxWLyp5aZy4UWShtov', '2025-06-25 01:15:47', '2025-06-25 01:16:36', 0),
(12, 6, '4xqN9xogLrAVsq7Z8it499k5Uuo3MiXz', '2025-06-26 04:25:08', '2025-06-26 06:53:03', 0),
(13, 2, '3YC9UuB_U2AGHaJFlt1qEbj9RLHpgBds', '2025-06-26 04:46:19', '2025-06-26 04:46:43', 0),
(14, 2, 'hCsXGkkRUChnbv1V-C_2bKVYfb6-HUxB', '2025-06-26 06:14:50', '2025-06-26 06:15:06', 0),
(15, 2, '6bd4gPykiSO8Zx9zCFo-rcVirsq5KyKe', '2025-06-26 06:46:02', '2025-06-26 06:46:32', 0),
(16, 2, 'fMVlgqpg0xlOMz-sP4FiGFfurtRm0fPU', '2025-06-26 06:49:06', '2025-06-26 06:56:43', 0),
(17, 6, 'CBiMmQ71f2fb0pPdGbfN0edFo2aALDlA', '2025-06-26 06:53:03', '2025-06-26 06:53:11', 0),
(18, 6, 'A1dpZo4u7asvsrC8elySjyhS1CtbZLRY', '2025-06-26 06:59:30', '2025-06-26 06:59:36', 0),
(19, 6, 'iPA8Y9bGYHMMxlVhhVKs4nbJbRz7vTMR', '2025-06-26 06:59:43', '2025-06-26 06:59:53', 0),
(20, 6, 'bWPr1bRroxXydUg6B3YTOrnMsbJ04xVj', '2025-06-26 07:19:46', '2025-06-26 07:20:47', 0),
(21, 6, 'WGU82IONQnuGgtBfX1_jrSR8qqw9z7TD', '2025-06-26 07:20:48', '2025-06-26 07:20:57', 0),
(22, 6, 'Y6CemLSMUwvNdIBy6G33wVSEHrSt5vLv', '2025-06-26 07:20:57', '2025-06-26 07:27:10', 0),
(23, 6, '1KohoPuoTsVTJprtyYJ4NpygnBWTzpSd', '2025-06-26 07:27:10', '2025-06-26 07:27:28', 0),
(24, 6, 'rRejkqgRAy-rQGiiSB4ipIS7kR2FphRO', '2025-06-26 07:37:05', '2025-06-26 07:37:09', 0),
(25, 6, 'aagDlHF4lLp7r6uaxiFfNfnVBmGGGCSh', '2025-06-26 07:37:09', '2025-06-26 07:41:35', 0),
(26, 6, '0C-1KpdY0xk1NWkhgByuoaS10vc5st3S', '2025-06-26 07:41:35', '2025-06-26 07:42:07', 0),
(27, 6, '1OOP-DlLxmItoUuy9egucsWM3BNiNomL', '2025-06-26 07:42:07', '2025-06-26 07:45:39', 0),
(28, 6, '1LDKdxOIjWx0t5O9EYj9s3xDj4JxUmFD', '2025-06-26 07:45:39', '2025-06-26 07:45:46', 0),
(29, 6, 'SzQTKq97UrOK_-IZSaUVSr-hyGhHIaTw', '2025-06-26 07:45:56', '2025-06-26 07:46:15', 0),
(30, 6, '9Xs62cUdBr0-QZrqlsBEYcTfYmNOv5VK', '2025-06-26 07:46:18', '2025-06-26 07:53:29', 0),
(31, 6, 'Rye4AkXVaq8C4gi-ojEzNNfK2TkGrgew', '2025-06-26 07:53:31', '2025-06-26 07:57:09', 0),
(32, 2, 'O5fBtFc4U-MMi0yfr3UlRWhgvqrxpqtB', '2025-06-26 07:57:14', '2025-06-26 07:59:19', 0),
(33, 6, 'ICXGEdTbABZmKSTcREPsp-mxNI-QnXFd', '2025-06-27 01:36:52', '2025-06-27 01:45:02', 0),
(34, 2, 'If0moAIMevxRPbAJQoRXLYZgXZX-njmo', '2025-06-27 01:48:28', '2025-06-27 01:48:45', 0),
(35, 6, '4jrKqAFNtVy4OfwTIMNOVxqE5EbWLDu9', '2025-06-27 01:48:52', '2025-06-28 16:08:53', 0),
(36, 2, 'Mkkat9oVRV7GxCS9e0fZSo-Fe3vLBI_6', '2025-06-28 14:43:49', '2025-06-28 15:36:06', 0),
(37, 6, 'Ww2Ggu0ZaMfw4iFSAMREEGEBiDOljhv5', '2025-06-28 15:39:50', '2025-06-28 15:42:40', 0),
(38, 6, '09AlX9SMvLfurowS_IccHW0QiKOrvkJp', '2025-06-28 15:39:57', '2025-06-28 15:42:30', 0),
(39, 6, 'oOlUQFjh5GsykOfFPoK731yPzgc43N8u', '2025-06-28 15:42:41', '2025-06-28 15:43:15', 0),
(40, 6, '3S__BI8gtBwNmkuhLlKseLKem8stfuzT', '2025-06-28 15:43:15', '2025-06-28 16:06:37', 0),
(41, 2, 'jmBhwrAp3Do2kt26GFd6vMd6YkVKByDh', '2025-06-28 16:06:21', '2025-06-28 16:06:30', 0),
(42, 6, 'Mva3B6c0oCGmfOZPqy5D7Ex2i0P_l3sB', '2025-06-28 16:08:54', '2025-06-28 16:16:10', 0),
(43, 6, 'dvc9-KpjvTWdPSrvB_32myBRMb4p7OzX', '2025-06-28 16:16:10', '2025-06-28 16:17:20', 0),
(44, 6, 'Sdxvo8FItFLET30cl_tSJRi4AQfSJHcz', '2025-06-28 16:27:15', '2025-06-28 16:27:20', 0),
(45, 6, '3yc0ax3JiM-7mvRorjjnyyP7mRb0uIXJ', '2025-06-28 16:27:20', '2025-06-28 16:30:35', 0),
(46, 6, 'TiFb80xNJV6Q7eyYkunBQlG3PzHqSHzN', '2025-06-28 16:32:11', '2025-06-28 17:04:06', 0),
(47, 6, 'OW492ml0tDsR1R8lcMMtqPv8hG_jVq-3', '2025-06-28 17:04:07', '2025-06-28 20:02:22', 0),
(48, 6, 'VQxVPKkBuBzbhdPvx8f7Syx3mzOa4Rj4', '2025-06-29 04:08:30', NULL, 1),
(49, 3, 'tDppT0S6VzHe1fpu_jfqowwXm54_OgME', '2025-06-29 05:56:40', '2025-06-29 06:01:23', 0),
(50, 3, 'O5oxeTwZmEAN2h8I2yUijsrrQAvW2mXB', '2025-06-29 06:01:36', '2025-06-29 06:07:10', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

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
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=128;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
