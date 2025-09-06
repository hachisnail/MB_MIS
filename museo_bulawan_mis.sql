-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Sep 06, 2025 at 02:11 PM
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
-- Table structure for table `appointment`
--

CREATE TABLE `appointment` (
  `appointment_id` int(11) NOT NULL,
  `visitor_id` int(11) NOT NULL,
  `purpose_of_visit` varchar(200) NOT NULL,
  `population_count` int(11) NOT NULL,
  `preferred_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `creation_date` datetime NOT NULL,
  `additional_notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointment`
--

INSERT INTO `appointment` (`appointment_id`, `visitor_id`, `purpose_of_visit`, `population_count`, `preferred_date`, `start_time`, `end_time`, `creation_date`, `additional_notes`) VALUES
(1, 1, 'Research Paper', 1, '2025-08-10', NULL, NULL, '2025-08-10 11:26:46', 'mehh'),
(3, 3, 'School Field Trip', 1, '2025-08-28', '14:30:00', '16:00:00', '2025-08-26 16:41:19', ''),
(4, 4, 'School Field Trip', 50, '2025-09-10', '09:00:00', '10:29:00', '2025-09-05 07:44:37', 'madami kami');

-- --------------------------------------------------------

--
-- Table structure for table `appointment_status`
--

CREATE TABLE `appointment_status` (
  `status_id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','FAILED','COMPLETED') NOT NULL DEFAULT 'PENDING',
  `present_count` int(11) DEFAULT NULL COMMENT 'Number of visitors who actually showed up',
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointment_status`
--

INSERT INTO `appointment_status` (`status_id`, `appointment_id`, `status`, `present_count`, `updated_at`) VALUES
(1, 1, 'COMPLETED', 1, '2025-08-31 04:28:40'),
(3, 3, 'APPROVED', NULL, '2025-08-26 16:49:55'),
(4, 4, 'COMPLETED', 21, '2025-09-05 07:47:07');

-- --------------------------------------------------------

--
-- Table structure for table `articles`
--

CREATE TABLE `articles` (
  `article_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `upload_date` datetime DEFAULT NULL,
  `images` text DEFAULT NULL,
  `article_category` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `editImages` text DEFAULT NULL,
  `caption` text DEFAULT NULL,
  `author` varchar(255) DEFAULT NULL,
  `barangay` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `status` enum('pending','posted') NOT NULL DEFAULT 'pending',
  `upload_period_start` datetime DEFAULT NULL,
  `upload_period_end` datetime DEFAULT NULL,
  `reviewer_notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `articles`
--

INSERT INTO `articles` (`article_id`, `title`, `user_id`, `upload_date`, `images`, `article_category`, `description`, `editImages`, `caption`, `author`, `barangay`, `address`, `status`, `upload_period_start`, `upload_period_end`, `reviewer_notes`, `created_at`, `updated_at`) VALUES
(1, 'Museom First Article', 1, '2025-04-23 00:00:00', NULL, 'Other', '<p>Test</p>', NULL, NULL, 'Jefferson', NULL, 'F. Pimentel St.', 'posted', NULL, NULL, NULL, '2025-04-26 10:52:20', '2025-05-17 08:07:10'),
(2, 'jyfcughb', 1, '2025-05-30 00:00:00', '1746514064797-Screenshot 2025-02-17 211931.png', 'Exhibit', '<p>uj uj h ilbouj</p>', NULL, NULL, '.kh b ', NULL, 'jgvukg', 'posted', NULL, NULL, NULL, '2025-05-06 06:47:44', '2025-05-17 08:07:08'),
(3, 'Test', 1, '2025-05-21 00:00:00', '1746518685594-Screenshot 2025-02-20 150548.png', 'Exhibit', '<p>adsasdasd</p>', NULL, NULL, 'again', NULL, 'dsada', 'posted', NULL, NULL, NULL, '2025-05-06 08:04:45', '2025-05-17 08:07:07'),
(4, 'Test Article', 1, '2025-05-13 00:00:00', '1747210320074-Screenshot 2025-02-19 231126.png', 'Contests', '<h1></h1><img src=\"http://localhost:5000/uploads/1747210257224-Screenshot 2025-02-17 211931.png\" alt=\"Screenshot 2025-02-17 211931.png\"><p style=\"text-align: justify\">It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using \'Content here, content here\', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for \'lorem ipsum\' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).</p><p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using \'Content here, content here\', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for \'lorem ipsum\' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).</p><p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using \'Content here, content here\', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for \'lorem ipsum\' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).asdasda</p><p></p>', NULL, NULL, 'Jeff', NULL, 'F. Pimentel', 'posted', NULL, NULL, NULL, '2025-05-14 08:12:00', '2025-05-17 10:05:41'),
(5, 'Hotdog', 1, '2025-05-19 00:00:00', '1747469413910-Screenshot 2025-05-11 191250.png', 'Education', '<h1 style=\"text-align: center\">Maloi</h1><p style=\"text-align: center\">can we <em>get </em><u>muc</u>h <strong>higherasdasdadadasdasdasda</strong></p><img src=\"http://localhost:5000/uploads/1747469371959-Screenshot 2025-05-13 165046.png\" alt=\"Screenshot 2025-05-13 165046.png\"><p>asfasfasf</p><p>asfasfasfasfasf</p><div class=\"column-block\"><div class=\"column\"><p>asfasf</p></div><div class=\"column\"><p>asfasf</p></div></div>', NULL, NULL, 'Louis', NULL, 'Daet', 'posted', NULL, NULL, NULL, '2025-05-17 08:10:13', '2025-05-17 12:24:30'),
(6, 'Test2', 1, '2025-05-21 00:00:00', '1747469522864-Screenshot 2023-12-23 050550.png', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p>asfasfasf</p></div><div class=\"column\"><p>asfafs</p></div></div>', NULL, NULL, 'Lousi', NULL, 'San Felipe', 'posted', NULL, NULL, NULL, '2025-05-17 08:12:02', '2025-05-17 08:12:08'),
(7, 'Louis', 1, '2025-05-18 00:00:00', '1747476803030-Screenshot 2023-12-23 221018.png', 'Education', '<div class=\"column-block\"><div class=\"column\"><p style=\"text-align: center\">asfasfasf</p></div><div class=\"column\"><p style=\"text-align: center\">asfasfasf</p></div></div>', NULL, NULL, 'HAfkha', NULL, 'asfasf', 'pending', NULL, NULL, NULL, '2025-05-17 10:13:23', '2025-05-17 10:13:23'),
(8, 'asfasf', 1, '2025-05-19 00:00:00', '1747477218780-Screenshot 2023-12-23 225735.png', 'Education', '<p>a</p><div class=\"column-block\"><div class=\"column\"><p>asfasfasfa</p></div><div class=\"column\"><p>fasfasfasfasfaasf</p></div></div>', NULL, NULL, 'afsasf', NULL, 'asfasf', 'pending', NULL, NULL, NULL, '2025-05-17 10:20:18', '2025-05-17 10:20:18'),
(9, 'Test', 1, '2025-05-19 00:00:00', '1747477776772-Screenshot 2024-01-02 054942.png', 'Education', '<div class=\"column-block\"><div class=\"column\"><p style=\"text-align: center\">asfasfasf</p></div><div class=\"column\"><p style=\"text-align: center\">asfasfasfasff</p></div></div>', NULL, NULL, 'Russel', NULL, 'Daet', 'pending', NULL, NULL, NULL, '2025-05-17 10:29:36', '2025-05-17 10:29:36'),
(10, 'HAHAHA', 1, '2025-05-19 00:00:00', '1747478496757-Screenshot 2023-12-20 043017.png', 'Education', '<div class=\"column-block\"><div class=\"column\"><p>fasfasfasf</p></div><div class=\"column\"><p>asfafafasf</p></div></div>', NULL, NULL, 'Hotdog', NULL, 'Daet', 'pending', NULL, NULL, NULL, '2025-05-17 10:41:36', '2025-05-17 10:41:36'),
(11, 'Bing chilling', 1, '2025-05-18 00:00:00', '1747483224063-Screenshot 2024-01-08 041755.png', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p style=\"text-align: center\">sfasfasfasfasfasfa</p><p style=\"text-align: center\">sf</p><p style=\"text-align: center\">asf</p><p style=\"text-align: center\">as</p><p style=\"text-align: center\">f</p><p style=\"text-align: center\">asf</p><p style=\"text-align: center\">as</p><p style=\"text-align: center\">fasfasfasfasfasfasfasfasf</p></div><div class=\"column\"><p style=\"text-align: center\">afsasfafasfasf</p><p style=\"text-align: center\">asfasfasfasfasfasfs</p><p style=\"text-align: center\">asfas</p><p style=\"text-align: center\">f</p><p style=\"text-align: center\">asf</p><p style=\"text-align: center\">asf</p><p style=\"text-align: center\">asfasfasfasf</p></div></div>', NULL, NULL, 'Louis', NULL, 'Daet', 'posted', NULL, NULL, NULL, '2025-05-17 12:00:24', '2025-05-17 12:33:55'),
(12, 'asfasf', 1, '2025-05-19 00:00:00', '1747484050870-Screenshot 2023-12-23 221018.png', 'Education', '<p>s</p><p>asfasfasf</p><p>asfasfasfasf</p>', NULL, NULL, 'asfasf', NULL, 'asfasf', 'posted', NULL, NULL, NULL, '2025-05-17 12:14:10', '2025-05-17 12:33:53'),
(13, 'asfasf', 1, '2025-05-19 00:00:00', NULL, 'Education', '<p>f</p><div class=\"column-block\"><div class=\"column\"><p>asfasfasf</p></div><div class=\"column\"><p>asfasfasf</p></div></div>', NULL, NULL, 'asfasfasf', NULL, 'asfasfasf', 'pending', NULL, NULL, NULL, '2025-05-17 15:28:04', '2025-05-17 15:28:04'),
(14, 'asfasf', 1, '2025-05-23 00:00:00', '1747496658910-Screenshot 2023-12-23 050503.png', 'Education', '<div class=\"column-block\"><div class=\"column\"><p>afasf</p></div><div class=\"column\"><p>asfasfasf</p></div></div>', NULL, NULL, 'asfasf', NULL, 'asfasf', 'pending', NULL, NULL, NULL, '2025-05-17 15:44:18', '2025-05-17 15:44:18'),
(15, 'asfasf', 1, '2025-05-21 00:00:00', '1747497211398-Screenshot 2023-12-23 221018.png', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p>asfasf</p></div><div class=\"column\"><p>asfasfasf</p></div></div>', NULL, NULL, 'asfasf', NULL, 'asfasf', 'pending', NULL, NULL, NULL, '2025-05-17 15:53:31', '2025-05-17 15:53:31'),
(16, 'asfasf', 1, '2025-05-20 00:00:00', '1747498380392-Screenshot 2023-12-23 050550.png', 'Exhibit', '<p>a</p><div class=\"column-block\"><div class=\"column\"><p>asfasf</p></div><div class=\"column\"><p>asfasfasfasf</p></div></div>', NULL, NULL, 'asfasfa', NULL, 'sfasfasf', 'posted', NULL, NULL, NULL, '2025-05-17 16:13:00', '2025-05-17 18:07:06'),
(17, 'asfasf', 1, '2025-05-21 00:00:00', '1747498632657-Screenshot 2023-12-23 221018.png', 'Education', '<p>f</p><div class=\"column-block\"><div class=\"column\"><p>asfasfasf</p></div><div class=\"column\"><p>asfasfasfasfa</p></div></div><p>asfasfasf</p>', NULL, NULL, 'asfas', NULL, 'fasfasfas', 'posted', NULL, NULL, NULL, '2025-05-17 16:17:12', '2025-05-17 18:10:08'),
(18, 'Louis', 1, '2025-05-19 00:00:00', '1747508474358-Screenshot 2024-01-02 055626.png', 'Contests', '<div class=\"column-block\"><div class=\"column\"><p>asfasfasf</p></div><div class=\"column\"><p>asfasfasf</p></div></div>', NULL, NULL, 'Louis', NULL, 'Daet', 'posted', NULL, NULL, NULL, '2025-05-17 19:01:14', '2025-05-17 19:07:47'),
(19, 'Hotodoggaghkajsg', 1, '2025-05-20 00:00:00', '1747508851484-Screenshot 2025-04-11 175845.png', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p>fasfjasfajshfasf</p></div><div class=\"column\"><p>asfjahfsjhajfsafs</p></div></div>', NULL, NULL, 'asfasjfaf', NULL, 'asfashjfasf', 'posted', NULL, NULL, NULL, '2025-05-17 19:07:31', '2025-05-17 19:07:46'),
(20, 'afsasfffasfs', 1, '2025-05-20 00:00:00', '1747509240931-Screenshot 2023-12-23 221018.png', 'Exhibit', '<p>f</p><div class=\"column-block\"><div class=\"column\"><p>asfasf</p></div><div class=\"column\"><p>asfasfasf</p></div></div>', NULL, NULL, 'assfs', NULL, 'sfasf', 'posted', NULL, NULL, NULL, '2025-05-17 19:14:00', '2025-05-17 21:22:32'),
(21, 'shhshhsbsd', 1, '2025-05-19 00:00:00', '1747511096283-Screenshot 2023-12-23 221018.png', 'Education', '<div class=\"column-block\"><div class=\"column\"><p>asfasfasf</p></div><div class=\"column\"><p>asfasf</p></div></div>', NULL, NULL, 'bsbdgsdg', NULL, 'sdgsdgsdg', 'posted', NULL, NULL, NULL, '2025-05-17 19:44:56', '2025-05-17 22:34:48'),
(22, 'Test v1', 1, '2025-05-18 00:00:00', '1747521461194-Screenshot 2024-01-13 095043.png', 'Other', '<div class=\"column-block\"><div class=\"column\"><p style=\"text-align: justify\"><span>eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupi</span></p><p style=\"text-align: justify\"><span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad</span></p><img src=\"http://localhost:5000/uploads/1747521432119-Screenshot 2023-12-22 220747.png\" alt=\"Screenshot 2023-12-22 220747.png\"><p><span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut</span></p></div><div class=\"column\"><p style=\"text-align: justify\"><span>Discovered at Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.</span></p><p style=\"text-align: justify\"><span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</span></p></div></div>', NULL, NULL, 'Russel', NULL, 'Daet', 'posted', NULL, NULL, NULL, '2025-05-17 22:37:41', '2025-05-17 22:37:51'),
(23, 'asfasf', 1, '2025-05-23 00:00:00', '1747522183737-Screenshot 2023-12-23 221018.png', 'Exhibit', '<p>a<span style=\"font-size: 20px\">asfasfasf</span><span style=\"font-size: 24px\">asfasfasfasf</span><span style=\"font-size: 32px\">asfasfasf</span><span style=\"font-size: 12px\">asfasfasf</span><span style=\"font-size: 16px\">asfasfasf</span></p>', NULL, NULL, 'asfasf', NULL, 'asfasf', 'posted', NULL, NULL, NULL, '2025-05-17 22:49:43', '2025-05-17 22:50:27'),
(24, 'HAHAHAHHA', 1, '2025-05-19 00:00:00', '1747548020413-Screenshot 2023-12-23 042044.png', 'Article', '<div class=\"column-block\"><div class=\"column\"><p>asfasf</p></div><div class=\"column\"><p>asfasf</p></div></div>', NULL, NULL, 'Hotodog', NULL, 'Daet', 'posted', NULL, NULL, NULL, '2025-05-18 06:00:20', '2025-05-18 06:00:30'),
(25, 'afasffffadfasfasf', 1, '2025-05-19 00:00:00', '1747548539618-Screenshot 2024-01-13 153048.png', 'Education', '<p>asfafasf</p>', NULL, NULL, 'asfsdasd', NULL, 'Daet', 'posted', NULL, NULL, NULL, '2025-05-18 06:08:59', '2025-05-18 06:09:02'),
(26, 'sfafasf', 1, '2025-05-23 00:00:00', '1747548726649-Screenshot 2023-12-23 050550.png', 'Exhibit', '<p>asfasfaasfasfasf<span style=\"font-size: 16px\">asfasfasfasfafsasf</span></p>', NULL, NULL, 'asfasf', NULL, 'Labo', 'posted', NULL, NULL, NULL, '2025-05-18 06:12:06', '2025-05-18 06:12:54'),
(27, 'asfasf', 1, '2025-05-20 00:00:00', '1747549006995-Screenshot 2023-12-23 221018.png', 'Exhibit', '<p>asfasfasf</p>', NULL, NULL, 'asfasf', NULL, 'San Lorenzo Ruiz', 'posted', NULL, NULL, NULL, '2025-05-18 06:16:47', '2025-05-18 06:16:49'),
(28, 'Museo Bulawan First\'s Article', 1, '2025-05-20 00:00:00', '1747662520945-456411725_818119137184125_1334004125955189067_n.png', 'Article', '<div class=\"column-block\"><div class=\"column\"><p><span>eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupi<br class=\"hard-break\"><br class=\"hard-break\"><span style=\"font-size: 16px\">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad<br class=\"hard-break\"><br class=\"hard-break\"></span></span></p><img src=\"http://localhost:5000/uploads/1747662407015-455363415_812761527719886_1195461782753847821_n.png\" alt=\"455363415_812761527719886_1195461782753847821_n.png\"><p><br class=\"hard-break\"><br class=\"hard-break\"><span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut<br class=\"hard-break\"><br class=\"hard-break\"></span></p><img src=\"http://localhost:5000/uploads/1747662449041-456426171_818223347173704_7806646081153137378_n 2.png\" alt=\"456426171_818223347173704_7806646081153137378_n 2.png\"><p><span><br class=\"hard-break\"><br class=\"hard-break\">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br class=\"hard-break\"></span><br class=\"hard-break\"></p></div><div class=\"column\"><p><span><span style=\"font-size: 12px\">Discovered at Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.<br class=\"hard-break\"><br class=\"hard-break\"></span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br class=\"hard-break\"><br class=\"hard-break\"><span style=\"font-size: 24px\">L</span>orem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud quisqui officia deserunt mollit anim id est laborum anim id est laborum.<br class=\"hard-break\">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br class=\"hard-break\"><br class=\"hard-break\"></span></p><img src=\"http://localhost:5000/uploads/1747662482630-456426171_818223347173704_7806646081153137378_n 2.png\" alt=\"456426171_818223347173704_7806646081153137378_n 2.png\"><p><br class=\"hard-break\"><span><span style=\"font-size: 12px\">Discovered at Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.<br class=\"hard-break\"><br class=\"hard-break\"></span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</span></p></div></div>', NULL, NULL, 'Russel', NULL, 'Daet', 'posted', NULL, NULL, NULL, '2025-05-19 13:48:40', '2025-05-19 13:48:42'),
(29, 'asfasf', 1, '2025-05-21 00:00:00', '1747675694170-image 46.png', 'Exhibit', '<p>asfasfafa<span style=\"font-size: 1em\">fsafasf</span><span style=\"font-size: 0.875em\">asfasfasf</span><span style=\"font-size: 1.5em\">asfasfasf</span><span style=\"font-size: 1.75em\">asfasfasf</span><span style=\"font-size: 2em\">asfasfasf<br class=\"hard-break\">asfasfasfasf</span><span style=\"font-size: 1em\">asfasfasfasf</span><span style=\"font-size: 0.875em\">asfasfasf</span></p>', NULL, NULL, 'asfasf', NULL, 'Daet', 'posted', NULL, NULL, NULL, '2025-05-19 17:28:14', '2025-05-19 17:28:16'),
(30, 'sfasfasfaccas', 1, '2025-05-21 00:00:00', '1747679689746-456411725_818119137184125_1334004125955189067_n.png', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p style=\"text-align: center\"><span style=\"font-size: 0.75em\">asfasf</span></p></div><div class=\"column\"><p style=\"text-align: center\"><span style=\"font-size: 1.25em\">asfasfasf</span></p></div><div class=\"column\"><p style=\"text-align: center\"><span style=\"font-size: 1.75em\">asfaf</span></p></div></div>', NULL, NULL, 'Russel', 'San Felipe', 'Basud', 'posted', NULL, NULL, NULL, '2025-05-19 18:34:49', '2025-05-19 20:02:25'),
(31, 'Test 4', 1, '2025-05-24 00:00:00', '1747680341894-6.jpg', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p><span style=\"font-size: 1.5em\">HAHA</span></p></div><div class=\"column\"><p><strong><em><u><span style=\"font-size: 2em\">HAHAHA</span></u></em></strong></p></div><div class=\"column\"><p><strong><u>HAHAHAHAAS<br class=\"hard-break\">FA<br class=\"hard-break\">FS<br class=\"hard-break\">AFS<br class=\"hard-break\"><br class=\"hard-break\">ASF<br class=\"hard-break\">AF<br class=\"hard-break\">A<br class=\"hard-break\"><span style=\"font-size: 1.25em\">SF<br class=\"hard-break\">ASF</span></u></strong><u><span style=\"font-size: 1.25em\"><br class=\"hard-break\">A<br class=\"hard-break\">SF<br class=\"hard-break\">A</span><br class=\"hard-break\">SFAFS</u></p></div></div>', NULL, NULL, 'Russel', 'San Felipeasfasfafasfasfaf', 'Basud', 'posted', NULL, NULL, NULL, '2025-05-19 18:45:41', '2025-05-19 20:02:26'),
(32, 'Address with barangay', 1, '2025-05-20 00:00:00', '1747681112976-DSC0018.jpg', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p>afasfasfasfasfaf</p></div><div class=\"column\"><p>asfasfasfasf</p></div></div>', NULL, NULL, 'Russel', 'Urbano', 'Daet', 'posted', NULL, NULL, NULL, '2025-05-19 18:58:32', '2025-05-19 20:11:09'),
(33, 'Address with barangay v2', 1, '2025-05-20 00:00:00', '1747681931880-Screenshot 2024-06-06 222217.png', 'Contests', '<p>asfasf</p><div class=\"column-block\"><div class=\"column\"><p>fasfa</p></div><div class=\"column\"><p>fasfa</p></div><div class=\"column\"><p>sfafsaf</p></div></div>', NULL, NULL, 'Russel', NULL, 'Basud', 'posted', NULL, NULL, NULL, '2025-05-19 19:12:11', '2025-05-19 20:11:08'),
(34, 'asfasfasfaf', 1, '2025-05-21 00:00:00', '1747682167831-Screenshot 2023-12-23 042044.png', 'Article', '<p>asfasfasf</p>', NULL, NULL, 'Russel', 'San Felipe', 'Jose Panganiban', 'posted', NULL, NULL, NULL, '2025-05-19 19:16:07', '2025-05-19 20:11:07'),
(35, 'Hello!', 1, '2025-05-21 00:00:00', '1747683837095-Screenshot 2024-03-19 203541.png', 'Education', '<div class=\"column-block\"><div class=\"column\"><p>eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupi<br><br><strong>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad</strong><br><br></p><img src=\"http://localhost:5000/uploads/1747683482223-455363415_812761527719886_1195461782753847821_n.png\" alt=\"455363415_812761527719886_1195461782753847821_n.png\"></div><div class=\"column\"><p><strong>Discovered at Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.</strong><br><br>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. test</p></div></div>', NULL, NULL, 'Russel', 'San Felipe', 'Daet', 'posted', NULL, NULL, NULL, '2025-05-19 19:43:57', '2025-08-01 05:42:38'),
(36, 'Font size on edit test', 1, '2025-05-21 00:00:00', '1747684251907-Screenshot 2024-11-14 172640.png', 'Contests', '<p><br class=\"hard-break\">asfasfasf<span style=\"font-size: 2em\">asfasfasf</span><span style=\"font-size: 1.75em\">asfasfasf</span><span style=\"font-size: 0.75em\">asfasfasf</span><u><span style=\"font-size: 2em\">asfasfasf</span></u><strong><u><span style=\"font-size: 2em\">asfasfasfasf</span></u></strong><br class=\"hard-break\"><br class=\"hard-break\"><br class=\"hard-break\"><br class=\"hard-break\"><br class=\"hard-break\"></p><div class=\"column-block\"><div class=\"column\"><img src=\"http://localhost:5000/uploads/1747684224922-Screenshot 2023-12-24 180620.png\" alt=\"Screenshot 2023-12-24 180620.png\"></div><div class=\"column\"><img src=\"http://localhost:5000/uploads/1747684221797-Screenshot 2023-12-24 180532.png\" alt=\"Screenshot 2023-12-24 180532.png\"></div></div>', NULL, NULL, 'asfasf', 'asfasf', 'Labo', '', NULL, NULL, NULL, '2025-05-19 19:50:51', '2025-08-23 16:10:49'),
(37, 'asfasfasf', 1, '2025-05-21 00:00:00', 'Screenshot 2023-12-23 050503-20250707-911104612.png', 'Exhibit', '<ul><li><p>asfasfasf</p></li><li><p>asfasf</p></li><li><p>asfasfasf</p></li></ul><p>asfasf</p><p></p><p></p><p>asf</p><p></p><p></p><p></p><p>asf</p><ul><li><p>asfasf</p></li><li><p>asfasfasf</p></li><li><p>asfasfasf</p></li><li><p>asf</p><div class=\"column-block\"><div class=\"column\"><ul><li><p>asfasf</p></li><li><p>asfasfasf</p></li></ul></div><div class=\"column\"><ul><li><p>asfasfasfas</p></li><li><p>asfasfasf</p></li><li><p>asfasfafs</p></li></ul><p></p></div><div class=\"column\"><ul><li><p>asfasf</p></li><li><p>asfasfa</p></li><li><p>fasfasfasf</p></li><li><p>asfasf</p></li></ul><p>asfasf</p></div></div><p></p></li></ul>', NULL, NULL, 'asfasfasf', 'asfasf', 'Labo', 'pending', NULL, NULL, NULL, '2025-05-19 23:14:08', '2025-07-17 04:56:14'),
(38, 'asfasf', 1, '2025-07-03 00:00:00', '1751833289835-e4e432e5ef46a79bc723fca8fead2fb5.mp4', 'Contests', '<p>asfafss</p>', NULL, NULL, 'asfasf', 'asfasf', 'Talisay', 'pending', NULL, NULL, NULL, '2025-07-06 20:21:29', '2025-08-01 05:42:11'),
(39, 'Run like a girl', 1, '2025-07-16 00:00:00', 'download-20250707-106391387.jpg', 'Contests', '<p><span><span>During Superbowl XLIX, a commercial aired across America showing young women and men’s responses when asked to ‘run like a girl’ or ‘throw like a girl.’ Most flounced around theatrically, saying things like, ‘Ooh, my hair.’</span></span><span>&nbsp;</span></p><p><span><span>When younger girls, like 10-year-old Dakota, were asked the same question, they sprinted across the stage or mimed a powerful pitch.</span></span><span>&nbsp;</span></p><p><span><span>It’s worth watching, or rewatching if you’ve seen it before. I find it moving every time. Search ‘Run Like a Girl commercial’ on YouTube to see it.</span></span><span>&nbsp;</span></p><p><span><span>The ad – created for the #LikeAGirl campaign launched by Always in 2014 – highlights how girls’ confidence can drop during puberty and how the humiliating messages our society sends, often unintentionally, can have a significant impact. Phrases like ‘you fight like a girl’ undermine girls’ self-belief. In other words, we do this to them.</span></span><span>&nbsp;</span></p><p><span><span>As parents, teachers, and members of society, we send countless signals to our children. Whether intended or not, these messages shape their expectations, anxieties, hopes, confidence, and self-doubt. This is not only about gender. Our influence can shape any of our children’s dispositions towards learning, life, and school.</span></span><span>&nbsp;</span></p><p><span><span>While that Superbowl commercial aired a decade ago, research published in recent months has shown how students’ dispositions to learning are shaped by us, and how these dispositions in turn influence achievement.</span></span><span>&nbsp;</span></p><p><span><span>The latest Trends in International Mathematics and Science Study (TIMSS) surveyed over 650,000 students across 63 countries. It found that Australia and France share the unenviable top spot for the largest gender gap in Year 4 mathematics performance (Wernert et al., 2024).</span></span><span>&nbsp;</span></p>', '[]', 'During Superbowl XLIX, a commercial aired across America showing young women and men’s responses when asked to ‘run like a girl’ or ‘throw like a girl.While that Superbowl commercial aired a decade ago, research published in recent months has shown how students’ dispositions to learning are shaped by us, and how these dispositions in turn influence achievement.Search ‘Run Like a Girl commercial’ on YouTube to see it.', 'asfasf', 'asfasf', 'Labo', 'posted', NULL, NULL, '', '2025-07-06 23:25:34', '2025-09-05 06:49:11'),
(40, 'asfasf', 1, '2025-07-09 00:00:00', 'download-20250707-222280195.jpg', 'Contests', '<p>asfasf</p>', NULL, NULL, 'asfasf', 'asfasf', 'San Lorenzo Ruiz', 'pending', NULL, NULL, NULL, '2025-07-07 05:42:40', '2025-07-07 05:43:46'),
(41, 'asfasfasf', 1, '2025-07-08 00:00:00', 'download-20250706-425345763.jpg', 'Article', '<p>asfasfasf</p>', NULL, NULL, 'asfasfa', 'asfafs', 'San Vicente', 'pending', NULL, NULL, NULL, '2025-07-07 05:49:51', '2025-07-07 05:49:51'),
(42, 'afasfasf', 1, '2025-07-09 00:00:00', 'Screenshot 2023-12-23 221018-20250707-980655258.png', 'Exhibit', '<p>fasfasf</p>', NULL, NULL, 'asdasd', 'asdasd', 'Santa Elena', 'pending', NULL, NULL, NULL, '2025-07-07 06:03:06', '2025-07-07 06:33:24'),
(43, 'asfasfsfcaqscasf', 1, '2025-07-09 00:00:00', 'download-20250707-471609449.jpg', 'Exhibit', '<p>asfasfasf</p>', NULL, NULL, 'asfasf', 'asfasf', 'Daet', 'pending', NULL, NULL, NULL, '2025-07-07 06:07:27', '2025-07-07 06:07:27'),
(44, 'asfasfasfasf', 1, '2025-07-17 00:00:00', 'photo_2024-02-05_09-58-45 (2)-20250707-994023271.jpg', 'Exhibit', '<p>asfasfasf</p>', NULL, NULL, 'asfasf', 'asfasfasf', 'Jose Panganiban', 'pending', NULL, NULL, NULL, '2025-07-07 06:14:23', '2025-07-07 06:14:23'),
(45, 'fasfaf', 1, '2025-07-09 00:00:00', 'photo_2024-02-05_09-59-13-20250707-48961874.jpg', 'Contests', '<p>safasf</p>', NULL, NULL, 'asfasf', 'asfasf', 'San Lorenzo Ruiz', 'pending', NULL, NULL, NULL, '2025-07-07 06:29:16', '2025-07-07 06:29:31'),
(46, 'Article testt', 1, '2025-08-21 00:00:00', NULL, 'Other', '<div class=\"column-block\"><div class=\"column\"><img src=\"http://localhost:5000/uploads/pictures/Screenshot 2025-02-17 133254-20250812-961696933.png\" alt=\"Screenshot 2025-02-17 133254.png\"></div><div class=\"column\"><h5>asdaskjdbaskjjbfjshdf</h5><h5>sdfsdfs</h5><h5>df</h5><h5>sdf</h5><h5>sd</h5><h5>fs</h5><h5>dfsd</h5><h5>f</h5><h5>sdf</h5><h5>sdfsdfsdfsdfdsf</h5></div><div class=\"column\"><p>asfsdgveravaesxvsdvsvadvsadv\\</p></div></div><p></p><p></p><div class=\"column-block\"><div class=\"column\"><p><em><span style=\"font-size: 2em\">asdasdsd</span></em></p></div><div class=\"column\"><p>tangina</p></div></div><p></p><p></p><div data-youtube-video=\"\"><iframe width=\"640\" height=\"480\" allowfullscreen=\"true\" autoplay=\"false\" disablekbcontrols=\"false\" enableiframeapi=\"false\" endtime=\"0\" ivloadpolicy=\"0\" loop=\"false\" modestbranding=\"false\" origin=\"\" playlist=\"\" rel=\"1\" src=\"https://www.youtube.com/embed/fHRS_NOs24w?rel=1\" start=\"0\"></iframe></div>', '[\"Screenshot 2025-02-17 133254-20250812-961696933.png\"]', NULL, 'Lexie Lore', 'Camambugan', 'Daet', 'posted', NULL, NULL, NULL, '2025-08-12 06:02:51', '2025-08-12 06:02:51');

-- --------------------------------------------------------

--
-- Table structure for table `contributionartifacts`
--

CREATE TABLE `contributionartifacts` (
  `artifact_id` int(11) NOT NULL,
  `contribution_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `acquisition_details` text NOT NULL,
  `additional_info` text DEFAULT NULL,
  `narrative` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`)),
  `related_images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`related_images`)),
  `image_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`image_urls`)),
  `document_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`document_urls`)),
  `related_image_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`related_image_urls`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contributionartifacts`
--

INSERT INTO `contributionartifacts` (`artifact_id`, `contribution_id`, `title`, `description`, `acquisition_details`, `additional_info`, `narrative`, `images`, `documents`, `related_images`, `image_urls`, `document_urls`, `related_image_urls`, `created_at`, `updated_at`) VALUES
(1, 7, 'Nokia 3311', 'Old indestructible phone', '', NULL, NULL, '[\"Screenshot 2025-02-17 211931-20250814-516449596.png\"]', '[\"wallpaperflare.com_wallpaper-20250818-69167840.jpg\"]', '[\"wallpaperflare.com_wallpaper-20250818-69167840.jpg\"]', '[]', '[]', '[]', '2025-08-14 10:27:07', '2026-08-14 10:27:07'),
(2, 8, 'Nokia 3562asd', 'Old indestructible phone', '', NULL, NULL, '[\"Screenshot 2025-02-19 213630-20250814-636414475.png\"]', '[\"Screenshot 2025-02-22 134410-20250814-533426963.png\", \"CNSC 33rd  Foundation Anniversary Narrative(Jefferson Talgtag)-20250605-407102184.docx\"]', '[\"Screenshot 2025-02-20 150548-20250814-521541143.png\"]', '[]', '[]', '[]', '2025-08-14 10:28:24', '2025-08-27 09:53:15'),
(3, 9, 'Nokia 3562asd', 'Old indestructible phone', '', NULL, NULL, '[\"Screenshot 2025-02-17 211931-20250814-642014940.png\"]', '[\"Screenshot 2025-02-17 233050-20250814-971592938.png\"]', '[\"Screenshot 2025-02-18 003846-20250814-82925227.png\",\"Screenshot 2025-02-18 003846-20250814-82925227.png\",\"Screenshot 2025-02-18 003846-20250814-82925227.png\"]', '[]', '[]', '[]', '2025-08-14 10:31:13', '2025-09-03 09:33:45'),
(4, 10, 'Nokia 3562asd', 'Test', '', NULL, NULL, '[\"Screenshot 2025-02-17 234304-20250814-708012145.png\"]', '[\"Screenshot 2025-02-17 234304-20250814-265095332.png\"]', '[\"Screenshot 2025-02-17 234304-20250814-142875363.png\"]', '[]', '[]', '[]', '2025-08-14 11:19:33', '2025-08-14 11:19:33'),
(5, 11, 'Phone', 'Test', '', NULL, NULL, '[\"Screenshot 2025-02-17 234304-20250814-399386749.png\"]', '[\"Screenshot 2025-02-17 234304-20250814-768107364.png\"]', '[\"Screenshot 2025-02-17 234304-20250814-193711477.png\"]', '[]', '[]', '[]', '2025-08-14 12:09:03', '2025-08-14 12:09:03'),
(6, 12, 'Nokia 3562asd', 'Test', '', NULL, NULL, '[\"Screenshot 2025-02-17 234304-20250814-695101055.png\"]', '[\"Screenshot 2025-02-18 003846-20250814-318743841.png\"]', '[\"Screenshot 2025-02-17 233050-20250814-760765042.png\"]', '[]', '[]', '[]', '2025-08-14 12:10:52', '2025-08-14 12:10:52'),
(7, 13, 'Sfdsf', 'Sdfsdf', 'Dsfsdf', NULL, NULL, '[\"Screenshot 2025-02-17 234304-20250814-606698517.png\"]', '[\"Screenshot 2025-02-18 003846-20250814-871150992.png\"]', '[\"Screenshot 2025-02-21 220151-20250814-417123154.png\"]', '[]', '[]', '[]', '2025-08-14 15:29:07', '2025-08-14 15:29:07'),
(8, 14, 'Nokia 3562', 'Sdfsdf', '', NULL, NULL, '[\"Screenshot 2025-02-17 234304-20250814-498358463.png\"]', '[\"Screenshot 2025-02-18 003846-20250814-487894970.png\"]', '[\"Screenshot 2025-02-22 134410-20250814-644687655.png\"]', '[]', '[]', '[]', '2025-08-14 15:30:19', '2025-08-14 15:30:19'),
(9, 15, 'Nokia 3311', 'Test', 'I recieved it as a gift', NULL, NULL, '[\"Screenshot 2025-02-17 133254-20250905-322959180.png\"]', '[\"Screenshot 2025-02-17 123515-20250905-669726470.png\"]', '[\"Screenshot 2025-02-17 123856-20250905-166522250.png\"]', '[]', '[]', '[]', '2025-09-05 07:32:19', '2025-09-05 07:32:19');

-- --------------------------------------------------------

--
-- Table structure for table `contributions`
--

CREATE TABLE `contributions` (
  `contribution_id` int(11) NOT NULL,
  `contributor_id` int(11) NOT NULL,
  `contribution_type` enum('lending','donation') NOT NULL,
  `narrative` text DEFAULT NULL,
  `submission_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contributions`
--

INSERT INTO `contributions` (`contribution_id`, `contributor_id`, `contribution_type`, `narrative`, `submission_date`, `status`, `created_at`, `updated_at`) VALUES
(7, 5, 'donation', NULL, '2025-08-14 10:27:07', 'pending', '2025-08-14 10:27:07', '2025-08-14 10:27:07'),
(8, 6, 'donation', NULL, '2025-08-14 10:28:24', 'pending', '2025-08-14 10:28:24', '2025-08-14 10:28:24'),
(9, 6, 'donation', NULL, '2025-08-14 10:31:13', 'pending', '2025-08-14 10:31:13', '2025-08-14 10:31:13'),
(10, 6, 'donation', NULL, '2025-08-14 11:19:33', 'pending', '2025-08-14 11:19:33', '2025-08-14 11:19:33'),
(11, 6, 'lending', NULL, '2025-08-14 12:09:03', 'pending', '2025-08-14 12:09:03', '2025-08-14 12:09:03'),
(12, 6, 'donation', NULL, '2025-08-14 12:10:52', 'pending', '2025-08-14 12:10:52', '2025-08-14 12:10:52'),
(13, 7, 'donation', NULL, '2025-08-14 15:29:07', 'pending', '2025-08-14 15:29:07', '2025-08-14 15:29:07'),
(14, 7, 'donation', NULL, '2025-08-14 15:30:19', 'pending', '2025-08-14 15:30:19', '2026-08-14 15:30:19'),
(15, 8, 'lending', NULL, '2025-09-05 07:32:19', 'pending', '2025-09-05 07:32:19', '2025-09-05 07:32:19');

-- --------------------------------------------------------

--
-- Table structure for table `contributors`
--

CREATE TABLE `contributors` (
  `contributor_id` int(11) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `birth_date` date DEFAULT NULL,
  `sex` enum('male','female','other') NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `organization` varchar(255) DEFAULT NULL,
  `province` varchar(255) DEFAULT NULL,
  `barangay` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contributors`
--

INSERT INTO `contributors` (`contributor_id`, `first_name`, `last_name`, `birth_date`, `sex`, `email`, `phone_number`, `organization`, `province`, `barangay`, `city`, `street`, `created_at`, `updated_at`) VALUES
(5, 'Jefferson ', 'Talagtag', '2025-08-02', 'male', 'jeffersontalagtag06@gmail.com', '09054163430', '', 'Agusan del Norte', 'Manoligao', 'Carmen', '', '2025-08-14 10:27:07', '2025-08-14 10:27:07'),
(6, 'Jefferson ', 'Asd', '2025-08-11', 'male', 'mateojept@gmail.com', '09123456789', '', 'Agusan del Sur', 'Aguinaldo', 'Esperanza', '', '2025-08-14 10:28:24', '2025-08-14 10:28:24'),
(7, 'Jefferson ', 'Adasd', '2025-08-12', 'male', 'jefferson@duck.com', '09123456789', '', 'Agusan del Sur', 'Concordia', 'Esperanza', '', '2025-08-14 15:29:07', '2025-08-14 15:29:07'),
(8, 'Hillaary', 'Delos Santos', '2003-02-20', 'male', 'hillarydelossantos21@gmail.com', '09123456789', 'Wefwerf', 'Albay', 'Anoling', 'Camalig', 'Asdasd', '2025-09-05 07:32:19', '2025-09-05 07:32:19');

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
  `position` enum('Staff','ContentManager','Viewer','Reviewer','Admin') DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `role` varchar(50) DEFAULT NULL,
  `roleId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invitations`
--

INSERT INTO `invitations` (`id`, `email`, `first_name`, `last_name`, `contact_number`, `token`, `expiresAt`, `isUsed`, `position`, `createdAt`, `updatedAt`, `role`, `roleId`) VALUES
(3, 'jeff.jefferson.jt@gmail.com', 'Test', 'Sins', '09123245678', '53a35676-a3ea-49ac-80dc-bb84864df53f', '2025-06-18 02:23:25', 1, NULL, '2025-06-11 02:23:25', '2025-06-11 03:26:51', 'Admin', NULL),
(5, 'jeffersontalagtag06@gmail.com', 'Jeffereson ', 'Talagtag', '09054163430', '8aecf2ae-878b-4453-b95f-87a2136f96c8', '2025-06-20 06:55:23', 1, NULL, '2025-06-13 02:57:20', '2025-06-14 13:27:20', 'Admin', NULL),
(15, 'hachisnail5000@gmail.com', 'rory', 'mercury', '09123456789', '615cd4b4-781a-4feb-9cad-12dff7376e0f', '2025-08-13 04:07:59', 1, NULL, '2025-08-06 04:07:59', '2025-08-06 04:13:08', 'ContentManager', NULL),
(19, 'lordjefferson13@gmail.com', 'lord', 'jefferson', '09123456789', 'f22f441a-e17f-46ad-8f6d-4aa137bb2f4e', '2025-08-13 04:41:56', 1, NULL, '2025-08-06 04:41:56', '2025-08-06 05:19:34', 'Reviewer', NULL),
(21, 'lordjefferson14@gmail.com', 'Happi', 'Pepper', '09123456789', '8c072959-4aed-471d-bf53-6d2e880e3d86', '2025-08-24 06:34:44', 0, NULL, '2025-08-17 06:34:44', '2025-08-17 06:34:44', 'Reviewer', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `lendingdetails`
--

CREATE TABLE `lendingdetails` (
  `lending_id` int(11) NOT NULL,
  `contribution_id` int(11) NOT NULL,
  `duration_from` date NOT NULL,
  `duration_to` date NOT NULL,
  `lend_conditions` text NOT NULL,
  `lend_liabilities` text NOT NULL,
  `lending_reason` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lendingdetails`
--

INSERT INTO `lendingdetails` (`lending_id`, `contribution_id`, `duration_from`, `duration_to`, `lend_conditions`, `lend_liabilities`, `lending_reason`, `created_at`, `updated_at`) VALUES
(2, 11, '2025-08-14', '2025-08-21', 'No specific conditions', '', '', '2025-08-14 12:09:03', '2025-08-14 12:09:03'),
(3, 15, '2025-09-15', '2036-09-10', 'No specific conditions', 'No specific liabilities', 'Just wanted to help out', '2025-09-05 07:32:19', '2025-09-05 07:32:19');

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
(5, 'System'),
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
  `updatedAt` datetime NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `backup_json` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `router_flags`
--

INSERT INTO `router_flags` (`id`, `route_key`, `is_enabled`, `createdAt`, `updatedAt`, `is_public`, `backup_json`) VALUES
(1, 'home', 1, '2025-06-09 12:52:19', '2025-09-05 08:04:34', 1, NULL),
(2, 'about', 1, '0000-00-00 00:00:00', '2025-09-05 08:04:35', 1, NULL),
(3, 'catalogs_public', 0, '2025-08-02 14:42:05', '2025-09-05 08:04:35', 1, NULL),
(4, 'acquisition_public', 1, '2025-08-02 14:42:05', '2025-09-05 08:04:35', 1, NULL),
(5, 'articles_public', 1, '2025-08-02 14:42:05', '2025-09-05 08:04:35', 1, NULL),
(6, 'appointment_public', 1, '2025-08-02 14:42:05', '2025-09-05 08:04:35', 1, NULL),
(7, 'login', 1, '2025-06-09 12:52:19', '2025-06-24 00:29:49', 0, NULL),
(8, 'catalogs', 1, '2025-06-09 12:52:19', '2025-08-23 16:26:30', 0, NULL),
(9, 'files', 1, '2025-06-09 12:52:19', '2025-08-26 16:55:35', 0, NULL),
(10, 'inventory', 1, '2025-06-09 12:52:19', '2025-08-03 14:05:54', 0, NULL),
(11, 'acquisition', 1, '2025-06-09 12:52:19', '2025-08-29 18:41:06', 0, NULL),
(12, 'schedule', 1, '2025-06-09 12:52:19', '2025-08-29 18:56:20', 0, NULL),
(13, 'article', 1, '2025-06-09 12:52:19', '2025-08-03 10:13:37', 0, NULL),
(14, 'appointment', 1, '2025-06-09 12:52:19', '2025-09-05 08:04:48', 0, NULL),
(15, 'sandbox', 1, '2025-06-09 12:52:19', '2025-07-12 16:44:16', 0, NULL),
(16, 'logs', 1, '2025-06-09 12:52:19', '2025-08-24 10:25:48', 0, NULL),
(17, 'user', 1, '2025-06-09 12:52:19', '2025-08-29 19:07:52', 0, NULL),
(18, 'down', 0, '0000-00-00 00:00:00', '2025-07-12 17:16:51', 0, NULL),
(19, 'maintenance', 0, '0000-00-00 00:00:00', '2025-09-05 08:04:34', 0, NULL),
(20, 'nomatch', 1, '0000-00-00 00:00:00', '2025-07-12 17:25:51', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `schedule_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `availability` enum('SHARED','EXCLUSIVE') NOT NULL DEFAULT 'SHARED',
  `status` enum('ACTIVE','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
('50zn00N_e4wkrKPI0Gj9HmZU7EdTSoFW', '2025-09-07 11:23:29', '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-09-07T11:23:26.557Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":6,\"user\":{\"id\":6,\"username\":\"hachisnail\",\"fname\":\"Jefferson\",\"lname\":\"Talagtag\",\"email\":\"jeffersontalagtag06@gmail.com\",\"roleId\":1,\"position\":\"System Administrator\"}}', '2025-09-06 11:23:26', '2025-09-06 11:23:29');

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
(1, 'system', 'SystemLmao', 'System', 'Account', 'system@yourapp.com', '', 5, 'System', '2025-06-24 09:22:06', '2025-06-24 09:22:06'),
(2, 'renz', '$2b$10$fmoc7qHXKiiK6Vmf0LsU6ePtiuHq2FwOR8QpmT/ObeZuY/0V7rq22', 'Renz', 'Labayan', 'labayanrenz@gmail.com', NULL, 1, 'Staff', '2025-05-22 02:45:01', '2025-07-09 14:45:13'),
(3, 'jeff', '$2b$10$u.XDk4TWmi3wGjGY9m/EDe0wT5xi0s7LPLpNQf7E3SnQowKCHtsua', 'Test', 'Dummy', 'jeff.jefferson.jt@gmail.com', '09123245678', 3, 'Tester', '2025-06-11 03:26:51', '2025-08-03 10:12:52'),
(4, 'test', '$2a$10$NKaNOQ4YOLOieY49Ol9xnOYjQenD5HlDcfCDwUOnYif84NBXYAchO', 'Johnny', 'Sins', 'jeffersontalagtag06@yahoo.com', '09054163430', 3, 'Tester', '2025-06-11 03:30:33', '2025-06-11 03:30:33'),
(6, 'hachisnail', '$2b$10$BggMQBNKEZ4jec1yF54E0uokERJSyTTimhfxpNd1Xk0pn/Y06AN5m', 'Jefferson', 'Talagtag', 'jeffersontalagtag06@gmail.com', '09054163430', 1, 'System Administrator', '2025-06-14 13:27:20', '2025-07-09 15:19:09'),
(7, 'rory', '$2b$10$M7GoCSYvqsDstb4ZhnKmPe8njJ7BrkMAADGwr0UfBgN.hXHmpRLEC', 'rory', 'mercury', 'hachisnail5000@gmail.com', '09123456789', 2, 'Mage', '2025-08-06 04:13:08', '2025-08-06 04:14:26'),
(8, 'hachi', '$2b$10$8yZlh8Ty33CCqH1U.Vrf.eOWq7K/X9ZcbOAEX7FfKmsiTQx/tuPyW', 'lord', 'jefferson', 'lordjefferson13@gmail.com', '09123456789', 4, 'test', '2025-08-06 05:19:34', '2025-08-06 05:19:34');

-- --------------------------------------------------------

--
-- Table structure for table `visitor`
--

CREATE TABLE `visitor` (
  `visitor_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `organization` varchar(150) DEFAULT NULL,
  `province` varchar(100) NOT NULL,
  `barangay` varchar(100) NOT NULL,
  `city_municipality` varchar(100) NOT NULL,
  `street` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `visitor`
--

INSERT INTO `visitor` (`visitor_id`, `first_name`, `last_name`, `email`, `phone`, `organization`, `province`, `barangay`, `city_municipality`, `street`) VALUES
(1, 'Jeff', 'Talagtag', 'jeffersontalagtag06@gmail.com', '09123456789', 'CNSC', 'Camarines Norte', 'Santa Elena ', 'Santa Elena', 'p-4'),
(3, 'Jefferson ', 'Talagtag', 'jeffersontalagtag06@gmail.com', '09123456789', '', 'Agusan del Sur', 'Cagbas', 'City of Bayugan', 'Asdasd'),
(4, 'Mauey', 'MAganda', 'mateojept@gmail.com', '09876543210', '', 'Agusan del Norte', 'Gosoon', 'Carmen', 'Urbano St.');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointment`
--
ALTER TABLE `appointment`
  ADD PRIMARY KEY (`appointment_id`),
  ADD KEY `visitor_id` (`visitor_id`);

--
-- Indexes for table `appointment_status`
--
ALTER TABLE `appointment_status`
  ADD PRIMARY KEY (`status_id`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`article_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `contributionartifacts`
--
ALTER TABLE `contributionartifacts`
  ADD PRIMARY KEY (`artifact_id`),
  ADD UNIQUE KEY `contribution_id` (`contribution_id`),
  ADD KEY `idx_artifact_contribution_id` (`contribution_id`);

--
-- Indexes for table `contributions`
--
ALTER TABLE `contributions`
  ADD PRIMARY KEY (`contribution_id`),
  ADD KEY `idx_contribution_contributor_id` (`contributor_id`),
  ADD KEY `idx_contribution_status` (`status`);

--
-- Indexes for table `contributors`
--
ALTER TABLE `contributors`
  ADD PRIMARY KEY (`contributor_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_contributor_email` (`email`);

--
-- Indexes for table `invitations`
--
ALTER TABLE `invitations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`);

--
-- Indexes for table `lendingdetails`
--
ALTER TABLE `lendingdetails`
  ADD PRIMARY KEY (`lending_id`),
  ADD UNIQUE KEY `contribution_id` (`contribution_id`),
  ADD KEY `idx_lending_contribution_id` (`contribution_id`);

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
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`schedule_id`);

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
-- Indexes for table `visitor`
--
ALTER TABLE `visitor`
  ADD PRIMARY KEY (`visitor_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointment`
--
ALTER TABLE `appointment`
  MODIFY `appointment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `appointment_status`
--
ALTER TABLE `appointment_status`
  MODIFY `status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `articles`
--
ALTER TABLE `articles`
  MODIFY `article_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `contributionartifacts`
--
ALTER TABLE `contributionartifacts`
  MODIFY `artifact_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `contributions`
--
ALTER TABLE `contributions`
  MODIFY `contribution_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `contributors`
--
ALTER TABLE `contributors`
  MODIFY `contributor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `invitations`
--
ALTER TABLE `invitations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `lendingdetails`
--
ALTER TABLE `lendingdetails`
  MODIFY `lending_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `router_flags`
--
ALTER TABLE `router_flags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `visitor`
--
ALTER TABLE `visitor`
  MODIFY `visitor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointment`
--
ALTER TABLE `appointment`
  ADD CONSTRAINT `appointment_ibfk_1` FOREIGN KEY (`visitor_id`) REFERENCES `visitor` (`visitor_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `appointment_status`
--
ALTER TABLE `appointment_status`
  ADD CONSTRAINT `appointment_status_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `contributionartifacts`
--
ALTER TABLE `contributionartifacts`
  ADD CONSTRAINT `contributionartifacts_ibfk_1` FOREIGN KEY (`contribution_id`) REFERENCES `contributions` (`contribution_id`) ON DELETE CASCADE;

--
-- Constraints for table `contributions`
--
ALTER TABLE `contributions`
  ADD CONSTRAINT `contributions_ibfk_1` FOREIGN KEY (`contributor_id`) REFERENCES `contributors` (`contributor_id`);

--
-- Constraints for table `lendingdetails`
--
ALTER TABLE `lendingdetails`
  ADD CONSTRAINT `lendingdetails_ibfk_1` FOREIGN KEY (`contribution_id`) REFERENCES `contributions` (`contribution_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
