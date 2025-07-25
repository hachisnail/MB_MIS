-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 12, 2025 at 08:12 PM
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
  `author` varchar(255) DEFAULT NULL,
  `barangay` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `status` enum('pending','posted') NOT NULL DEFAULT 'pending',
  `upload_period_start` datetime DEFAULT NULL,
  `upload_period_end` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `articles`
--

INSERT INTO `articles` (`article_id`, `title`, `user_id`, `upload_date`, `images`, `article_category`, `description`, `editImages`, `author`, `barangay`, `address`, `status`, `upload_period_start`, `upload_period_end`, `created_at`, `updated_at`) VALUES
(1, 'Museom First Article', 1, '2025-04-23 00:00:00', NULL, 'Other', '<p>Test</p>', NULL, 'Jefferson', NULL, 'F. Pimentel St.', 'posted', NULL, NULL, '2025-04-26 10:52:20', '2025-05-17 08:07:10'),
(2, 'jyfcughb', 1, '2025-05-30 00:00:00', '1746514064797-Screenshot 2025-02-17 211931.png', 'Exhibit', '<p>uj uj h ilbouj</p>', NULL, '.kh b ', NULL, 'jgvukg', 'posted', NULL, NULL, '2025-05-06 06:47:44', '2025-05-17 08:07:08'),
(3, 'Test', 1, '2025-05-21 00:00:00', '1746518685594-Screenshot 2025-02-20 150548.png', 'Exhibit', '<p>adsasdasd</p>', NULL, 'again', NULL, 'dsada', 'posted', NULL, NULL, '2025-05-06 08:04:45', '2025-05-17 08:07:07'),
(4, 'Test Article', 1, '2025-05-13 00:00:00', '1747210320074-Screenshot 2025-02-19 231126.png', 'Contests', '<h1></h1><img src=\"http://localhost:5000/uploads/1747210257224-Screenshot 2025-02-17 211931.png\" alt=\"Screenshot 2025-02-17 211931.png\"><p style=\"text-align: justify\">It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using \'Content here, content here\', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for \'lorem ipsum\' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).</p><p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using \'Content here, content here\', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for \'lorem ipsum\' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).</p><p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using \'Content here, content here\', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for \'lorem ipsum\' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).asdasda</p><p></p>', NULL, 'Jeff', NULL, 'F. Pimentel', 'posted', NULL, NULL, '2025-05-14 08:12:00', '2025-05-17 10:05:41'),
(5, 'Hotdog', 1, '2025-05-19 00:00:00', '1747469413910-Screenshot 2025-05-11 191250.png', 'Education', '<h1 style=\"text-align: center\">Maloi</h1><p style=\"text-align: center\">can we <em>get </em><u>muc</u>h <strong>higherasdasdadadasdasdasda</strong></p><img src=\"http://localhost:5000/uploads/1747469371959-Screenshot 2025-05-13 165046.png\" alt=\"Screenshot 2025-05-13 165046.png\"><p>asfasfasf</p><p>asfasfasfasfasf</p><div class=\"column-block\"><div class=\"column\"><p>asfasf</p></div><div class=\"column\"><p>asfasf</p></div></div>', NULL, 'Louis', NULL, 'Daet', 'posted', NULL, NULL, '2025-05-17 08:10:13', '2025-05-17 12:24:30'),
(6, 'Test2', 1, '2025-05-21 00:00:00', '1747469522864-Screenshot 2023-12-23 050550.png', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p>asfasfasf</p></div><div class=\"column\"><p>asfafs</p></div></div>', NULL, 'Lousi', NULL, 'San Felipe', 'posted', NULL, NULL, '2025-05-17 08:12:02', '2025-05-17 08:12:08'),
(7, 'Louis', 1, '2025-05-18 00:00:00', '1747476803030-Screenshot 2023-12-23 221018.png', 'Education', '<div class=\"column-block\"><div class=\"column\"><p style=\"text-align: center\">asfasfasf</p></div><div class=\"column\"><p style=\"text-align: center\">asfasfasf</p></div></div>', NULL, 'HAfkha', NULL, 'asfasf', 'pending', NULL, NULL, '2025-05-17 10:13:23', '2025-05-17 10:13:23'),
(8, 'asfasf', 1, '2025-05-19 00:00:00', '1747477218780-Screenshot 2023-12-23 225735.png', 'Education', '<p>a</p><div class=\"column-block\"><div class=\"column\"><p>asfasfasfa</p></div><div class=\"column\"><p>fasfasfasfasfaasf</p></div></div>', NULL, 'afsasf', NULL, 'asfasf', 'pending', NULL, NULL, '2025-05-17 10:20:18', '2025-05-17 10:20:18'),
(9, 'Test', 1, '2025-05-19 00:00:00', '1747477776772-Screenshot 2024-01-02 054942.png', 'Education', '<div class=\"column-block\"><div class=\"column\"><p style=\"text-align: center\">asfasfasf</p></div><div class=\"column\"><p style=\"text-align: center\">asfasfasfasff</p></div></div>', NULL, 'Russel', NULL, 'Daet', 'pending', NULL, NULL, '2025-05-17 10:29:36', '2025-05-17 10:29:36'),
(10, 'HAHAHA', 1, '2025-05-19 00:00:00', '1747478496757-Screenshot 2023-12-20 043017.png', 'Education', '<div class=\"column-block\"><div class=\"column\"><p>fasfasfasf</p></div><div class=\"column\"><p>asfafafasf</p></div></div>', NULL, 'Hotdog', NULL, 'Daet', 'pending', NULL, NULL, '2025-05-17 10:41:36', '2025-05-17 10:41:36'),
(11, 'Bing chilling', 1, '2025-05-18 00:00:00', '1747483224063-Screenshot 2024-01-08 041755.png', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p style=\"text-align: center\">sfasfasfasfasfasfa</p><p style=\"text-align: center\">sf</p><p style=\"text-align: center\">asf</p><p style=\"text-align: center\">as</p><p style=\"text-align: center\">f</p><p style=\"text-align: center\">asf</p><p style=\"text-align: center\">as</p><p style=\"text-align: center\">fasfasfasfasfasfasfasfasf</p></div><div class=\"column\"><p style=\"text-align: center\">afsasfafasfasf</p><p style=\"text-align: center\">asfasfasfasfasfasfs</p><p style=\"text-align: center\">asfas</p><p style=\"text-align: center\">f</p><p style=\"text-align: center\">asf</p><p style=\"text-align: center\">asf</p><p style=\"text-align: center\">asfasfasfasf</p></div></div>', NULL, 'Louis', NULL, 'Daet', 'posted', NULL, NULL, '2025-05-17 12:00:24', '2025-05-17 12:33:55'),
(12, 'asfasf', 1, '2025-05-19 00:00:00', '1747484050870-Screenshot 2023-12-23 221018.png', 'Education', '<p>s</p><p>asfasfasf</p><p>asfasfasfasf</p>', NULL, 'asfasf', NULL, 'asfasf', 'posted', NULL, NULL, '2025-05-17 12:14:10', '2025-05-17 12:33:53'),
(13, 'asfasf', 1, '2025-05-19 00:00:00', NULL, 'Education', '<p>f</p><div class=\"column-block\"><div class=\"column\"><p>asfasfasf</p></div><div class=\"column\"><p>asfasfasf</p></div></div>', NULL, 'asfasfasf', NULL, 'asfasfasf', 'pending', NULL, NULL, '2025-05-17 15:28:04', '2025-05-17 15:28:04'),
(14, 'asfasf', 1, '2025-05-23 00:00:00', '1747496658910-Screenshot 2023-12-23 050503.png', 'Education', '<div class=\"column-block\"><div class=\"column\"><p>afasf</p></div><div class=\"column\"><p>asfasfasf</p></div></div>', NULL, 'asfasf', NULL, 'asfasf', 'pending', NULL, NULL, '2025-05-17 15:44:18', '2025-05-17 15:44:18'),
(15, 'asfasf', 1, '2025-05-21 00:00:00', '1747497211398-Screenshot 2023-12-23 221018.png', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p>asfasf</p></div><div class=\"column\"><p>asfasfasf</p></div></div>', NULL, 'asfasf', NULL, 'asfasf', 'pending', NULL, NULL, '2025-05-17 15:53:31', '2025-05-17 15:53:31'),
(16, 'asfasf', 1, '2025-05-20 00:00:00', '1747498380392-Screenshot 2023-12-23 050550.png', 'Exhibit', '<p>a</p><div class=\"column-block\"><div class=\"column\"><p>asfasf</p></div><div class=\"column\"><p>asfasfasfasf</p></div></div>', NULL, 'asfasfa', NULL, 'sfasfasf', 'posted', NULL, NULL, '2025-05-17 16:13:00', '2025-05-17 18:07:06'),
(17, 'asfasf', 1, '2025-05-21 00:00:00', '1747498632657-Screenshot 2023-12-23 221018.png', 'Education', '<p>f</p><div class=\"column-block\"><div class=\"column\"><p>asfasfasf</p></div><div class=\"column\"><p>asfasfasfasfa</p></div></div><p>asfasfasf</p>', NULL, 'asfas', NULL, 'fasfasfas', 'posted', NULL, NULL, '2025-05-17 16:17:12', '2025-05-17 18:10:08'),
(18, 'Louis', 1, '2025-05-19 00:00:00', '1747508474358-Screenshot 2024-01-02 055626.png', 'Contests', '<div class=\"column-block\"><div class=\"column\"><p>asfasfasf</p></div><div class=\"column\"><p>asfasfasf</p></div></div>', NULL, 'Louis', NULL, 'Daet', 'posted', NULL, NULL, '2025-05-17 19:01:14', '2025-05-17 19:07:47'),
(19, 'Hotodoggaghkajsg', 1, '2025-05-20 00:00:00', '1747508851484-Screenshot 2025-04-11 175845.png', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p>fasfjasfajshfasf</p></div><div class=\"column\"><p>asfjahfsjhajfsafs</p></div></div>', NULL, 'asfasjfaf', NULL, 'asfashjfasf', 'posted', NULL, NULL, '2025-05-17 19:07:31', '2025-05-17 19:07:46'),
(20, 'afsasfffasfs', 1, '2025-05-20 00:00:00', '1747509240931-Screenshot 2023-12-23 221018.png', 'Exhibit', '<p>f</p><div class=\"column-block\"><div class=\"column\"><p>asfasf</p></div><div class=\"column\"><p>asfasfasf</p></div></div>', NULL, 'assfs', NULL, 'sfasf', 'posted', NULL, NULL, '2025-05-17 19:14:00', '2025-05-17 21:22:32'),
(21, 'shhshhsbsd', 1, '2025-05-19 00:00:00', '1747511096283-Screenshot 2023-12-23 221018.png', 'Education', '<div class=\"column-block\"><div class=\"column\"><p>asfasfasf</p></div><div class=\"column\"><p>asfasf</p></div></div>', NULL, 'bsbdgsdg', NULL, 'sdgsdgsdg', 'posted', NULL, NULL, '2025-05-17 19:44:56', '2025-05-17 22:34:48'),
(22, 'Test v1', 1, '2025-05-18 00:00:00', '1747521461194-Screenshot 2024-01-13 095043.png', 'Other', '<div class=\"column-block\"><div class=\"column\"><p style=\"text-align: justify\"><span>eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupi</span></p><p style=\"text-align: justify\"><span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad</span></p><img src=\"http://localhost:5000/uploads/1747521432119-Screenshot 2023-12-22 220747.png\" alt=\"Screenshot 2023-12-22 220747.png\"><p><span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut</span></p></div><div class=\"column\"><p style=\"text-align: justify\"><span>Discovered at Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.</span></p><p style=\"text-align: justify\"><span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</span></p></div></div>', NULL, 'Russel', NULL, 'Daet', 'posted', NULL, NULL, '2025-05-17 22:37:41', '2025-05-17 22:37:51'),
(23, 'asfasf', 1, '2025-05-23 00:00:00', '1747522183737-Screenshot 2023-12-23 221018.png', 'Exhibit', '<p>a<span style=\"font-size: 20px\">asfasfasf</span><span style=\"font-size: 24px\">asfasfasfasf</span><span style=\"font-size: 32px\">asfasfasf</span><span style=\"font-size: 12px\">asfasfasf</span><span style=\"font-size: 16px\">asfasfasf</span></p>', NULL, 'asfasf', NULL, 'asfasf', 'posted', NULL, NULL, '2025-05-17 22:49:43', '2025-05-17 22:50:27'),
(24, 'HAHAHAHHA', 1, '2025-05-19 00:00:00', '1747548020413-Screenshot 2023-12-23 042044.png', 'Article', '<div class=\"column-block\"><div class=\"column\"><p>asfasf</p></div><div class=\"column\"><p>asfasf</p></div></div>', NULL, 'Hotodog', NULL, 'Daet', 'posted', NULL, NULL, '2025-05-18 06:00:20', '2025-05-18 06:00:30'),
(25, 'afasffffadfasfasf', 1, '2025-05-19 00:00:00', '1747548539618-Screenshot 2024-01-13 153048.png', 'Education', '<p>asfafasf</p>', NULL, 'asfsdasd', NULL, 'Daet', 'posted', NULL, NULL, '2025-05-18 06:08:59', '2025-05-18 06:09:02'),
(26, 'sfafasf', 1, '2025-05-23 00:00:00', '1747548726649-Screenshot 2023-12-23 050550.png', 'Exhibit', '<p>asfasfaasfasfasf<span style=\"font-size: 16px\">asfasfasfasfafsasf</span></p>', NULL, 'asfasf', NULL, 'Labo', 'posted', NULL, NULL, '2025-05-18 06:12:06', '2025-05-18 06:12:54'),
(27, 'asfasf', 1, '2025-05-20 00:00:00', '1747549006995-Screenshot 2023-12-23 221018.png', 'Exhibit', '<p>asfasfasf</p>', NULL, 'asfasf', NULL, 'San Lorenzo Ruiz', 'posted', NULL, NULL, '2025-05-18 06:16:47', '2025-05-18 06:16:49'),
(28, 'Museo Bulawan First\'s Article', 1, '2025-05-20 00:00:00', '1747662520945-456411725_818119137184125_1334004125955189067_n.png', 'Article', '<div class=\"column-block\"><div class=\"column\"><p><span>eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupi<br class=\"hard-break\"><br class=\"hard-break\"><span style=\"font-size: 16px\">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad<br class=\"hard-break\"><br class=\"hard-break\"></span></span></p><img src=\"http://localhost:5000/uploads/1747662407015-455363415_812761527719886_1195461782753847821_n.png\" alt=\"455363415_812761527719886_1195461782753847821_n.png\"><p><br class=\"hard-break\"><br class=\"hard-break\"><span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut<br class=\"hard-break\"><br class=\"hard-break\"></span></p><img src=\"http://localhost:5000/uploads/1747662449041-456426171_818223347173704_7806646081153137378_n 2.png\" alt=\"456426171_818223347173704_7806646081153137378_n 2.png\"><p><span><br class=\"hard-break\"><br class=\"hard-break\">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br class=\"hard-break\"></span><br class=\"hard-break\"></p></div><div class=\"column\"><p><span><span style=\"font-size: 12px\">Discovered at Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.<br class=\"hard-break\"><br class=\"hard-break\"></span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br class=\"hard-break\"><br class=\"hard-break\"><span style=\"font-size: 24px\">L</span>orem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud quisqui officia deserunt mollit anim id est laborum anim id est laborum.<br class=\"hard-break\">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br class=\"hard-break\"><br class=\"hard-break\"></span></p><img src=\"http://localhost:5000/uploads/1747662482630-456426171_818223347173704_7806646081153137378_n 2.png\" alt=\"456426171_818223347173704_7806646081153137378_n 2.png\"><p><br class=\"hard-break\"><span><span style=\"font-size: 12px\">Discovered at Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.<br class=\"hard-break\"><br class=\"hard-break\"></span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</span></p></div></div>', NULL, 'Russel', NULL, 'Daet', 'posted', NULL, NULL, '2025-05-19 13:48:40', '2025-05-19 13:48:42'),
(29, 'asfasf', 1, '2025-05-21 00:00:00', '1747675694170-image 46.png', 'Exhibit', '<p>asfasfafa<span style=\"font-size: 1em\">fsafasf</span><span style=\"font-size: 0.875em\">asfasfasf</span><span style=\"font-size: 1.5em\">asfasfasf</span><span style=\"font-size: 1.75em\">asfasfasf</span><span style=\"font-size: 2em\">asfasfasf<br class=\"hard-break\">asfasfasfasf</span><span style=\"font-size: 1em\">asfasfasfasf</span><span style=\"font-size: 0.875em\">asfasfasf</span></p>', NULL, 'asfasf', NULL, 'Daet', 'posted', NULL, NULL, '2025-05-19 17:28:14', '2025-05-19 17:28:16'),
(30, 'sfasfasfaccas', 1, '2025-05-21 00:00:00', '1747679689746-456411725_818119137184125_1334004125955189067_n.png', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p style=\"text-align: center\"><span style=\"font-size: 0.75em\">asfasf</span></p></div><div class=\"column\"><p style=\"text-align: center\"><span style=\"font-size: 1.25em\">asfasfasf</span></p></div><div class=\"column\"><p style=\"text-align: center\"><span style=\"font-size: 1.75em\">asfaf</span></p></div></div>', NULL, 'Russel', 'San Felipe', 'Basud', 'posted', NULL, NULL, '2025-05-19 18:34:49', '2025-05-19 20:02:25'),
(31, 'Test 4', 1, '2025-05-24 00:00:00', '1747680341894-6.jpg', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p><span style=\"font-size: 1.5em\">HAHA</span></p></div><div class=\"column\"><p><strong><em><u><span style=\"font-size: 2em\">HAHAHA</span></u></em></strong></p></div><div class=\"column\"><p><strong><u>HAHAHAHAAS<br class=\"hard-break\">FA<br class=\"hard-break\">FS<br class=\"hard-break\">AFS<br class=\"hard-break\"><br class=\"hard-break\">ASF<br class=\"hard-break\">AF<br class=\"hard-break\">A<br class=\"hard-break\"><span style=\"font-size: 1.25em\">SF<br class=\"hard-break\">ASF</span></u></strong><u><span style=\"font-size: 1.25em\"><br class=\"hard-break\">A<br class=\"hard-break\">SF<br class=\"hard-break\">A</span><br class=\"hard-break\">SFAFS</u></p></div></div>', NULL, 'Russel', 'San Felipeasfasfafasfasfaf', 'Basud', 'posted', NULL, NULL, '2025-05-19 18:45:41', '2025-05-19 20:02:26'),
(32, 'Address with barangay', 1, '2025-05-20 00:00:00', '1747681112976-DSC0018.jpg', 'Exhibit', '<div class=\"column-block\"><div class=\"column\"><p>afasfasfasfasfaf</p></div><div class=\"column\"><p>asfasfasfasf</p></div></div>', NULL, 'Russel', 'Urbano', 'Daet', 'posted', NULL, NULL, '2025-05-19 18:58:32', '2025-05-19 20:11:09'),
(33, 'Address with barangay v2', 1, '2025-05-20 00:00:00', '1747681931880-Screenshot 2024-06-06 222217.png', 'Contests', '<p>asfasf</p><div class=\"column-block\"><div class=\"column\"><p>fasfa</p></div><div class=\"column\"><p>fasfa</p></div><div class=\"column\"><p>sfafsaf</p></div></div>', NULL, 'Russel', NULL, 'Basud', 'posted', NULL, NULL, '2025-05-19 19:12:11', '2025-05-19 20:11:08'),
(34, 'asfasfasfaf', 1, '2025-05-21 00:00:00', '1747682167831-Screenshot 2023-12-23 042044.png', 'Article', '<p>asfasfasf</p>', NULL, 'Russel', 'San Felipe', 'Jose Panganiban', 'posted', NULL, NULL, '2025-05-19 19:16:07', '2025-05-19 20:11:07'),
(35, 'Hello!', 1, '2025-05-21 00:00:00', '1747683837095-Screenshot 2024-03-19 203541.png', 'Education', '<div class=\"column-block\"><div class=\"column\"><p>eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupi<br class=\"hard-break\"><span><span><br class=\"hard-break\"></span><strong><span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad</span></strong><span><br class=\"hard-break\"><br class=\"hard-break\"></span></span></p><img src=\"http://localhost:5000/uploads/1747683482223-455363415_812761527719886_1195461782753847821_n.png\" alt=\"455363415_812761527719886_1195461782753847821_n.png\"></div><div class=\"column\"><p><span><strong><span>Discovered at Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.</span></strong><span><br class=\"hard-break\"><br class=\"hard-break\"></span></span>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p></div></div>', NULL, 'Russel', 'San Felipe', 'Daet', 'posted', NULL, NULL, '2025-05-19 19:43:57', '2025-05-19 20:11:06'),
(36, 'Font size on edit test', 1, '2025-05-21 00:00:00', '1747684251907-Screenshot 2024-11-14 172640.png', 'Contests', '<p><br class=\"hard-break\">asfasfasf<span style=\"font-size: 2em\">asfasfasf</span><span style=\"font-size: 1.75em\">asfasfasf</span><span style=\"font-size: 0.75em\">asfasfasf</span><u><span style=\"font-size: 2em\">asfasfasf</span></u><strong><u><span style=\"font-size: 2em\">asfasfasfasf</span></u></strong><br class=\"hard-break\"><br class=\"hard-break\"><br class=\"hard-break\"><br class=\"hard-break\"><br class=\"hard-break\"></p><div class=\"column-block\"><div class=\"column\"><img src=\"http://localhost:5000/uploads/1747684224922-Screenshot 2023-12-24 180620.png\" alt=\"Screenshot 2023-12-24 180620.png\"></div><div class=\"column\"><img src=\"http://localhost:5000/uploads/1747684221797-Screenshot 2023-12-24 180532.png\" alt=\"Screenshot 2023-12-24 180532.png\"></div></div>', NULL, 'asfasf', 'asfasf', 'Labo', 'pending', NULL, NULL, '2025-05-19 19:50:51', '2025-06-09 11:37:07'),
(37, 'asfasfasf', 1, '2025-05-21 00:00:00', 'Screenshot 2023-12-23 050503-20250707-911104612.png', 'Exhibit', '<ul><li><p>asfasfasf</p></li><li><p>asfasf</p></li><li><p>asfasfasf</p></li></ul><p>asfasf</p><p></p><p></p><p>asf</p><p></p><p></p><p></p><p>asf</p><ul><li><p>asfasf</p></li><li><p>asfasfasf</p></li><li><p>asfasfasf</p></li><li><p>asf</p><div class=\"column-block\"><div class=\"column\"><ul><li><p>asfasf</p></li><li><p>asfasfasf</p></li></ul></div><div class=\"column\"><ul><li><p>asfasfasfas</p></li><li><p>asfasfasf</p></li><li><p>asfasfafs</p></li></ul><p></p></div><div class=\"column\"><ul><li><p>asfasf</p></li><li><p>asfasfa</p></li><li><p>fasfasfasf</p></li><li><p>asfasf</p></li></ul><p>asfasf</p></div></div><p></p></li></ul>', NULL, 'asfasfasf', 'asfasf', 'Labo', 'posted', NULL, NULL, '2025-05-19 23:14:08', '2025-07-07 06:33:42'),
(38, 'asfasf', 1, '2025-07-03 00:00:00', '1751833289835-e4e432e5ef46a79bc723fca8fead2fb5.mp4', 'Contests', '<p>asfaf</p>', NULL, 'asfasf', 'asfasf', 'Talisay', 'pending', NULL, NULL, '2025-07-06 20:21:29', '2025-07-06 20:21:29'),
(39, 'asfasf', 1, '2025-07-16 00:00:00', 'download-20250707-106391387.jpg', 'Contests', '<p>asfasfa</p>', NULL, 'asfasf', 'asfasf', 'Labo', 'pending', NULL, NULL, '2025-07-06 23:25:34', '2025-07-07 05:39:43'),
(40, 'asfasf', 1, '2025-07-09 00:00:00', 'download-20250707-222280195.jpg', 'Contests', '<p>asfasf</p>', NULL, 'asfasf', 'asfasf', 'San Lorenzo Ruiz', 'pending', NULL, NULL, '2025-07-07 05:42:40', '2025-07-07 05:43:46'),
(41, 'asfasfasf', 1, '2025-07-08 00:00:00', 'download-20250706-425345763.jpg', 'Article', '<p>asfasfasf</p>', NULL, 'asfasfa', 'asfafs', 'San Vicente', 'pending', NULL, NULL, '2025-07-07 05:49:51', '2025-07-07 05:49:51'),
(42, 'afasfasf', 1, '2025-07-09 00:00:00', 'Screenshot 2023-12-23 221018-20250707-980655258.png', 'Exhibit', '<p>fasfasf</p>', NULL, 'asdasd', 'asdasd', 'Santa Elena', 'pending', NULL, NULL, '2025-07-07 06:03:06', '2025-07-07 06:33:24'),
(43, 'asfasfsfcaqscasf', 1, '2025-07-09 00:00:00', 'download-20250707-471609449.jpg', 'Exhibit', '<p>asfasfasf</p>', NULL, 'asfasf', 'asfasf', 'Daet', 'pending', NULL, NULL, '2025-07-07 06:07:27', '2025-07-07 06:07:27'),
(44, 'asfasfasfasf', 1, '2025-07-17 00:00:00', 'photo_2024-02-05_09-58-45 (2)-20250707-994023271.jpg', 'Exhibit', '<p>asfasfasf</p>', NULL, 'asfasf', 'asfasfasf', 'Jose Panganiban', 'pending', NULL, NULL, '2025-07-07 06:14:23', '2025-07-07 06:14:23'),
(45, 'fasfaf', 1, '2025-07-09 00:00:00', 'photo_2024-02-05_09-59-13-20250707-48961874.jpg', 'Contests', '<p>safasf</p>', NULL, 'asfasf', 'asfasf', 'San Lorenzo Ruiz', 'pending', NULL, NULL, '2025-07-07 06:29:16', '2025-07-07 06:29:31');

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
(1, 'login', 1, '2025-06-09 12:52:19', '2025-06-24 00:29:49', 0, NULL),
(2, 'catalogs', 0, '2025-06-09 12:52:19', '2025-07-12 17:46:19', 1, NULL),
(3, 'home', 1, '2025-06-09 12:52:19', '2025-07-12 17:46:19', 1, NULL),
(4, 'files', 1, '2025-06-09 12:52:19', '2025-07-12 17:38:47', 0, NULL),
(5, 'inventory', 1, '2025-06-09 12:52:19', '2025-07-12 14:58:20', 0, NULL),
(6, 'acquisition', 1, '2025-06-09 12:52:19', '2025-07-07 07:50:48', 0, NULL),
(7, 'schedule', 1, '2025-06-09 12:52:19', '2025-07-12 15:21:25', 0, NULL),
(8, 'article', 1, '2025-06-09 12:52:19', '2025-07-07 07:50:52', 0, NULL),
(9, 'appointment', 1, '2025-06-09 12:52:19', '2025-07-12 15:17:30', 0, NULL),
(10, 'sandbox', 1, '2025-06-09 12:52:19', '2025-07-12 16:44:16', 0, NULL),
(11, 'logs', 1, '2025-06-09 12:52:19', '2025-07-12 15:03:18', 0, NULL),
(12, 'user', 1, '2025-06-09 12:52:19', '2025-07-07 07:50:51', 0, NULL),
(13, 'down', 0, '0000-00-00 00:00:00', '2025-07-12 17:16:51', 0, NULL),
(14, 'maintenance', 0, '0000-00-00 00:00:00', '2025-07-12 17:46:19', 0, NULL),
(15, 'nomatch', 1, '0000-00-00 00:00:00', '2025-07-12 17:25:51', 0, NULL);

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
('vNiAqI5lda_EwDtLDv3TasX37eOGW23D', '2025-07-13 18:10:44', '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-07-13T13:47:50.090Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":6,\"user\":{\"id\":6,\"username\":\"hachisnail\",\"fname\":\"Jefferson\",\"lname\":\"Talagtag\",\"email\":\"jeffersontalagtag06@gmail.com\",\"roleId\":1,\"position\":\"System Administrator\"}}', '2025-07-12 13:47:50', '2025-07-12 18:10:44');

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
(1, 'system', '$2a$10$X2eQbE6n3fOQgTmkEoO8VOra9NxYFiW0X3ExL1cOARfV5acFPv2Py', 'System', 'Account', 'system@yourapp.com', '', 5, 'System', '2025-06-24 09:22:06', '2025-06-24 09:22:06'),
(2, 'renz', '$2b$10$fmoc7qHXKiiK6Vmf0LsU6ePtiuHq2FwOR8QpmT/ObeZuY/0V7rq22', 'Renz', 'Labayan', 'labayanrenz@gmail.com', NULL, 1, 'Staff', '2025-05-22 02:45:01', '2025-07-09 14:45:13'),
(3, 'jeff', '$2a$10$DG3E/ijj2AhdHgVjp6KwMujqExMLVeP5VwTHa7KJelSf5sMjwoB.a', 'Test', 'Dummy', 'jeff.jefferson.jt@gmail.com', '09123245678', 2, 'Tester', '2025-06-11 03:26:51', '2025-06-11 03:26:51'),
(4, 'test', '$2a$10$NKaNOQ4YOLOieY49Ol9xnOYjQenD5HlDcfCDwUOnYif84NBXYAchO', 'Johnny', 'Sins', 'jeffersontalagtag06@yahoo.com', '09054163430', NULL, 'Tester', '2025-06-11 03:30:33', '2025-06-11 03:30:33'),
(6, 'hachisnail', '$2b$10$BggMQBNKEZ4jec1yF54E0uokERJSyTTimhfxpNd1Xk0pn/Y06AN5m', 'Jefferson', 'Talagtag', 'jeffersontalagtag06@gmail.com', '09054163430', 1, 'System Administrator', '2025-06-14 13:27:20', '2025-07-09 15:19:09');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`article_id`),
  ADD KEY `user_id` (`user_id`);

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
-- AUTO_INCREMENT for table `articles`
--
ALTER TABLE `articles`
  MODIFY `article_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `invitations`
--
ALTER TABLE `invitations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `router_flags`
--
ALTER TABLE `router_flags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

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
