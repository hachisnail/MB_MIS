-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jun 07, 2025 at 06:15 PM
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
('VAQ7u8dE31kWXvli0EwUsecyfCGVqfNb', '2025-06-08 16:06:14', '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-06-08T15:59:53.781Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":1,\"user\":{\"id\":1,\"username\":\"jefferson06\",\"fname\":\"Jefferson\",\"lname\":\"Talagtag\",\"email\":\"jeffersontalagtag06@gmail.com\",\"roleId\":1,\"position\":\"ContentManager\"}}', '2025-06-07 15:59:53', '2025-06-07 16:06:14');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fname` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `contact` varchar(20) DEFAULT NULL,
  `roleId` int(11) DEFAULT NULL,
  `position` enum('Staff','ContentManager','Viewer','Reviewer','Admin') DEFAULT 'Staff',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `lname` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `fname`, `email`, `contact`, `roleId`, `position`, `createdAt`, `updatedAt`, `lname`) VALUES
(1, 'jefferson06', '$2a$10$HGZGUkRMt/qdhLp.wzE6j.eW9ajXk127zo5PL26MU9GHpVUY/tGA6', 'Jefferson', 'jeffersontalagtag06@gmail.com', '09054173430', 1, 'ContentManager', '2025-05-22 01:21:29', '2025-05-22 01:22:56', 'Talagtag'),
(2, 'renz', '$2a$10$HGZGUkRMt/qdhLp.wzE6j.eW9ajXk127zo5PL26MU9GHpVUY/tGA6', 'Renz', 'labayanrenz@gmail.com', NULL, 3, 'Staff', '2025-05-22 02:45:01', '2025-05-22 02:45:01', 'Labayan');

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
(9, 1, '_C1ZnNaPnsU8DweOYFay93mbydRbOKGj', '2025-05-21 18:25:01', '2025-05-21 18:25:27', 0),
(10, 1, 'Pc1-_uKTYNPntFeQZOmHmT9n89wMRvx-', '2025-05-21 18:25:53', '2025-05-21 18:27:43', 0),
(12, 1, 'GojPvk8lkcckEKT0Xo8ig3GgYjuMwKx3', '2025-05-21 18:31:27', '2025-05-21 18:33:03', 0),
(14, 1, 'nDppfZqL2BsCHi0kp1NBz4kBu2mmvpsE', '2025-05-21 18:33:41', '2025-05-21 18:33:54', 0),
(15, 1, '5Iag0sSO45sExD3W2sd-6twAQFTWgWpV', '2025-05-21 18:33:54', '2025-05-21 18:42:15', 0),
(16, 2, 'zXfVbcD6lr4fHJFZF6FTrVRD-BJr1n1K', '2025-05-21 18:45:11', '2025-05-21 18:45:41', 0),
(17, 1, '8rn4W-uyTchlIIGvI17YBJ8k_0IwInGj', '2025-05-21 18:48:05', '2025-05-21 18:49:59', 0),
(18, 1, '0lpjeNIhLgSU0twSuAnEpZV4onGpgcuC', '2025-05-21 18:49:59', '2025-05-21 18:50:34', 0),
(19, 2, '3DSUZBdYAASO4Qhj2efyhzTIqFX3CmpP', '2025-05-21 18:50:17', '2025-05-21 18:50:53', 0),
(20, 1, 'OnwEo9IW0Rg5U6UxoPj8xvU6ijoWyebD', '2025-05-22 04:53:05', '2025-05-22 05:47:14', 0),
(21, 1, 'DSjxFGhkZOxvLXVbAcVmZvYH_24mVSl-', '2025-05-22 05:47:33', '2025-05-22 05:48:00', 0),
(22, 1, 'tjPowWleiBBG9ky7iojfMBTchWv99KjO', '2025-05-22 05:48:02', '2025-05-22 05:49:27', 0),
(23, 1, 'rs0lUh-gF8dP3rcCj2hDDQVXyZPlwtme', '2025-05-22 05:49:30', '2025-05-22 05:50:32', 0),
(24, 1, 'yGtakW8V_zymtE-gzXcXKg53bikrIYz5', '2025-05-22 05:50:35', '2025-05-22 05:53:33', 0),
(25, 1, 'qUtFlU54PGCVAQgT0Ih1I9Nv2ibW9TtS', '2025-05-22 05:53:35', '2025-05-22 05:56:09', 0),
(26, 1, 'ZYnwxZCtirY7IRYw-7IOoNJ9Wtuw3xdH', '2025-05-22 05:56:16', '2025-05-22 05:57:55', 0),
(27, 1, 'x0QJlzjiKFSwbbtnM3QcoRrXg3Eu6pKX', '2025-05-22 05:57:57', '2025-05-22 05:59:07', 0),
(28, 1, 'y61r8_a360V3BIpikGjzVa_C0LNV8ab9', '2025-05-22 05:59:13', '2025-05-22 06:18:17', 0),
(29, 1, 'BMgOm4WjvM1aZGRhVKe9W8J8MBG5YUCe', '2025-05-22 06:18:19', '2025-05-22 06:32:33', 0),
(30, 1, 'icgwe9N4EtZF0ZXDkoY18LVdSqvVYq6L', '2025-05-22 06:32:35', '2025-05-22 07:19:23', 0),
(31, 2, '8-NdmCj7S5UgwhtreB_1fxu5OlQkpVfI', '2025-05-22 07:19:26', '2025-05-22 07:19:31', 0),
(32, 2, 'vvFS1BZ0fjVeOPteusxChf3h7IehrhSG', '2025-05-22 07:19:34', '2025-05-22 07:19:35', 0),
(33, 1, 'bLxvE9xl_znjH8sHloGdLMPJ-vJNPKZ0', '2025-05-22 07:19:36', '2025-05-22 07:27:12', 0),
(34, 2, 'PcFAEAQnyg33fUEkYadJ6DgsFhWaqmji', '2025-05-22 07:27:15', '2025-05-22 07:34:56', 0),
(36, 1, 'T9eiuvOy23F2KlALl5ieWZq3rLesRAPv', '2025-05-22 07:35:13', '2025-05-22 07:50:17', 0),
(37, 2, 'JpNCuOEmUTpt6tlkTKLd9Jm57O4aclxc', '2025-05-22 07:50:20', '2025-05-22 08:33:34', 0),
(38, 1, 'wNzfgqEcUEUj8OW32gGniwDJ3T8Pteq1', '2025-05-22 08:37:02', '2025-05-22 08:49:23', 0),
(39, 1, 'bwxMvU-r0YpDqjuFkQP_V4wiJyymvgco', '2025-05-22 13:04:07', '2025-05-22 13:31:49', 0),
(40, 2, 'VtpoD02wB-YArT3rrluCCyWWf_AxNBo3', '2025-05-22 13:31:52', '2025-05-22 14:10:17', 0),
(41, 1, 'datFsv_lTBzVCXz7Tidu4zKgEsGq1bSc', '2025-05-22 14:10:28', '2025-05-22 17:49:54', 0),
(43, 1, 'DlGpsaS1vK3PYA7mcIcOrECUTGptsFz3', '2025-05-22 17:49:57', '2025-05-22 17:56:10', 0),
(44, 1, 'D2oSSIHJaGAmV3zq-YToKJkui51oRsH_', '2025-05-22 17:56:13', '2025-05-22 17:56:52', 0),
(45, 1, 'KnVd2GrN-9Id1H0qG9PZaCN-UajjGxYr', '2025-05-22 17:56:55', '2025-05-23 09:53:31', 0),
(46, 2, 't3o1iia2O0GAgBABy5y0K5Nhl_QdmyEx', '2025-05-23 09:53:34', '2025-05-23 09:55:07', 0),
(47, 1, 'm56oUUqtIIPOhEZwPAbbl4QZ93kBVz6n', '2025-05-23 09:55:09', '2025-06-03 00:07:25', 0),
(48, 1, '3aE9p6jOUuOsSFrhNW_THOT5xlLQeQV4', '2025-06-03 00:07:25', '2025-06-03 00:11:18', 0),
(50, 2, 'smB_sFmJKLFhRYnN--5P_SCI2utL5nOZ', '2025-06-03 00:11:43', '2025-06-03 00:12:14', 0),
(51, 1, 'WR2HqNLGI8z96Nhi3E0oRkXdHsgVUCpu', '2025-06-03 00:12:36', '2025-06-03 00:20:05', 0),
(53, 1, 'dwsY8h69I3jHhBWTLgbdjKxuzYpKx8f0', '2025-06-03 00:20:07', '2025-06-03 09:44:56', 0),
(55, 1, 'T6MJi5noPpvg_JpZu_kU9gqGW8xJdU7s', '2025-06-03 09:44:59', '2025-06-03 09:45:39', 0),
(56, 1, 'XOqpPQ1Fe8rqlSZv1NskQthajq0ViDDW', '2025-06-03 10:59:27', '2025-06-03 10:59:30', 0),
(57, 1, 'yTRUlJfRPK8B7Od0UX94HCbEd4LJNDKw', '2025-06-03 10:59:58', '2025-06-03 11:00:13', 0),
(58, 1, 'XOGvn2nvJUpfpP-UMYI5Q9ya2qQ81vfP', '2025-06-03 11:31:34', '2025-06-03 11:31:38', 0),
(59, 2, 'URUP6RcU-EecYoujA3_S7w2TueLY6Qt_', '2025-06-03 11:31:43', '2025-06-03 11:31:45', 0),
(60, 1, 'cjmcotDshCdz4ZuWE0DtfIe02U4pAn2Y', '2025-06-03 11:39:40', '2025-06-03 11:39:46', 0),
(61, 1, 'mNH7x0eA609NTdrRi4BtLpSRj63u10hX', '2025-06-03 11:45:33', '2025-06-03 11:45:43', 0),
(62, 2, 'gAnCUxun4E4zqKISGP-KVF8Qu_vXn2XB', '2025-06-03 12:32:07', '2025-06-03 12:32:08', 0),
(63, 1, 'YQAdW5q6PciIwPCy6DuEhcGty0RkGLcN', '2025-06-04 02:17:03', '2025-06-04 11:32:06', 0),
(70, 1, 'sf_2Ed2sZlI-AETrteS38rfaCQYG-MBY', '2025-06-04 11:33:31', '2025-06-04 11:33:55', 0),
(71, 1, 'JL8i5_vsEaUsG9lDOtGT2ZFSpNh6Hku4', '2025-06-04 14:15:20', '2025-06-05 01:40:03', 0),
(73, 1, 'BUjW8Gj2juPGr8iWp6sNclybG5pn-IeH', '2025-06-05 01:40:06', '2025-06-05 01:58:50', 0),
(74, 1, 'fhWkv0uK4PrPHheW6S_Wx5WU0tv9qN-l', '2025-06-05 01:58:50', '2025-06-05 03:08:51', 0),
(75, 1, '0HmgZjmXWJ_DTz2w8aLIXsxLkz0JMGnM', '2025-06-05 03:08:56', '2025-06-05 03:45:20', 0),
(77, 1, 'AdJYSppcNA3h6-6pMnEmla9lj70eGWmH', '2025-06-05 03:45:22', '2025-06-05 07:10:39', 0),
(79, 1, '08ltS3-pGkh3DJ5CvXrGMyVTOJqMMSpB', '2025-06-05 07:10:41', '2025-06-05 07:10:47', 0),
(80, 1, 'RALrxut4jy4wRXOipg8hYDLzo5_gHd5x', '2025-06-05 07:10:56', '2025-06-07 13:02:24', 0),
(81, 1, 'mnMMlgBSOr19DVg7USevkyN8j00B2NLU', '2025-06-07 13:02:24', '2025-06-07 13:03:34', 0),
(83, 1, 'mIpVbW-sGsg2oh4noRZvyDR8zCa1QFM7', '2025-06-07 13:03:35', '2025-06-07 13:04:52', 0),
(84, 1, 'Vy3nfXmX1NJTFsnMZ2gzF0psR9nF8nVV', '2025-06-07 13:04:55', '2025-06-07 13:05:01', 0),
(85, 2, 'Kb0ZJqyIGVz65g1D6ctpo5A1Au2M0p1i', '2025-06-07 13:05:04', '2025-06-07 13:05:07', 0),
(86, 1, 'NPS0yUkBrTz5btx1knAhsDc8VYmWfbiq', '2025-06-07 13:05:09', '2025-06-07 13:20:57', 0),
(88, 1, 'yb-KYCndhk4aj8dNN0GmK-g-r8rN0zvi', '2025-06-07 13:20:59', '2025-06-07 13:21:13', 0),
(89, 1, 'j-GueasPsK7-oUVlooCKySTzH0EXyPcV', '2025-06-07 13:21:21', '2025-06-07 15:15:44', 0),
(91, 1, 'pcaG34MdJrWC23nBJHhEWjhx752__1Hm', '2025-06-07 15:15:47', '2025-06-07 15:35:43', 0),
(92, 1, 'Auy9DcK3wS2R1j_-gQ0NcOZkZXJ4G45N', '2025-06-07 15:36:00', '2025-06-07 15:48:28', 0),
(93, 1, 'eGNBQtl3Wl7Csejd8ce9LgWU5q7D4j9v', '2025-06-07 15:48:37', '2025-06-07 15:59:47', 0),
(94, 1, 'VAQ7u8dE31kWXvli0EwUsecyfCGVqfNb', '2025-06-07 15:59:53', NULL, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `name_2` (`name`),
  ADD UNIQUE KEY `name_3` (`name`),
  ADD UNIQUE KEY `name_4` (`name`),
  ADD UNIQUE KEY `name_5` (`name`),
  ADD UNIQUE KEY `name_6` (`name`),
  ADD UNIQUE KEY `name_7` (`name`),
  ADD UNIQUE KEY `name_8` (`name`),
  ADD UNIQUE KEY `name_9` (`name`),
  ADD UNIQUE KEY `name_10` (`name`),
  ADD UNIQUE KEY `name_11` (`name`),
  ADD UNIQUE KEY `name_12` (`name`),
  ADD UNIQUE KEY `name_13` (`name`),
  ADD UNIQUE KEY `name_14` (`name`),
  ADD UNIQUE KEY `name_15` (`name`),
  ADD UNIQUE KEY `name_16` (`name`),
  ADD UNIQUE KEY `name_17` (`name`),
  ADD UNIQUE KEY `name_18` (`name`),
  ADD UNIQUE KEY `name_19` (`name`),
  ADD UNIQUE KEY `name_20` (`name`),
  ADD UNIQUE KEY `name_21` (`name`),
  ADD UNIQUE KEY `name_22` (`name`),
  ADD UNIQUE KEY `name_23` (`name`),
  ADD UNIQUE KEY `name_24` (`name`),
  ADD UNIQUE KEY `name_25` (`name`),
  ADD UNIQUE KEY `name_26` (`name`),
  ADD UNIQUE KEY `name_27` (`name`),
  ADD UNIQUE KEY `name_28` (`name`),
  ADD UNIQUE KEY `name_29` (`name`),
  ADD UNIQUE KEY `name_30` (`name`),
  ADD UNIQUE KEY `name_31` (`name`),
  ADD UNIQUE KEY `name_32` (`name`),
  ADD UNIQUE KEY `name_33` (`name`),
  ADD UNIQUE KEY `name_34` (`name`),
  ADD UNIQUE KEY `name_35` (`name`),
  ADD UNIQUE KEY `name_36` (`name`),
  ADD UNIQUE KEY `name_37` (`name`),
  ADD UNIQUE KEY `name_38` (`name`),
  ADD UNIQUE KEY `name_39` (`name`),
  ADD UNIQUE KEY `name_40` (`name`),
  ADD UNIQUE KEY `name_41` (`name`),
  ADD UNIQUE KEY `name_42` (`name`),
  ADD UNIQUE KEY `name_43` (`name`),
  ADD UNIQUE KEY `name_44` (`name`),
  ADD UNIQUE KEY `name_45` (`name`),
  ADD UNIQUE KEY `name_46` (`name`),
  ADD UNIQUE KEY `name_47` (`name`),
  ADD UNIQUE KEY `name_48` (`name`),
  ADD UNIQUE KEY `name_49` (`name`),
  ADD UNIQUE KEY `name_50` (`name`),
  ADD UNIQUE KEY `name_51` (`name`),
  ADD UNIQUE KEY `name_52` (`name`),
  ADD UNIQUE KEY `name_53` (`name`),
  ADD UNIQUE KEY `name_54` (`name`),
  ADD UNIQUE KEY `name_55` (`name`),
  ADD UNIQUE KEY `name_56` (`name`),
  ADD UNIQUE KEY `name_57` (`name`),
  ADD UNIQUE KEY `name_58` (`name`),
  ADD UNIQUE KEY `name_59` (`name`),
  ADD UNIQUE KEY `name_60` (`name`),
  ADD UNIQUE KEY `name_61` (`name`),
  ADD UNIQUE KEY `name_62` (`name`),
  ADD UNIQUE KEY `name_63` (`name`);

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
  ADD UNIQUE KEY `username_2` (`username`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `username_3` (`username`),
  ADD UNIQUE KEY `email_3` (`email`),
  ADD UNIQUE KEY `username_4` (`username`),
  ADD UNIQUE KEY `email_4` (`email`),
  ADD UNIQUE KEY `username_5` (`username`),
  ADD UNIQUE KEY `email_5` (`email`),
  ADD UNIQUE KEY `username_6` (`username`),
  ADD UNIQUE KEY `email_6` (`email`),
  ADD UNIQUE KEY `username_7` (`username`),
  ADD UNIQUE KEY `email_7` (`email`),
  ADD UNIQUE KEY `username_8` (`username`),
  ADD UNIQUE KEY `email_8` (`email`),
  ADD UNIQUE KEY `username_9` (`username`),
  ADD UNIQUE KEY `email_9` (`email`),
  ADD UNIQUE KEY `username_10` (`username`),
  ADD UNIQUE KEY `email_10` (`email`),
  ADD UNIQUE KEY `username_11` (`username`),
  ADD UNIQUE KEY `email_11` (`email`),
  ADD UNIQUE KEY `username_12` (`username`),
  ADD UNIQUE KEY `email_12` (`email`),
  ADD UNIQUE KEY `username_13` (`username`),
  ADD UNIQUE KEY `email_13` (`email`),
  ADD UNIQUE KEY `username_14` (`username`),
  ADD UNIQUE KEY `email_14` (`email`),
  ADD UNIQUE KEY `username_15` (`username`),
  ADD UNIQUE KEY `email_15` (`email`),
  ADD UNIQUE KEY `username_16` (`username`),
  ADD UNIQUE KEY `email_16` (`email`),
  ADD UNIQUE KEY `username_17` (`username`),
  ADD UNIQUE KEY `email_17` (`email`),
  ADD UNIQUE KEY `username_18` (`username`),
  ADD UNIQUE KEY `email_18` (`email`),
  ADD UNIQUE KEY `username_19` (`username`),
  ADD UNIQUE KEY `email_19` (`email`),
  ADD UNIQUE KEY `username_20` (`username`),
  ADD UNIQUE KEY `email_20` (`email`),
  ADD UNIQUE KEY `username_21` (`username`),
  ADD UNIQUE KEY `email_21` (`email`),
  ADD UNIQUE KEY `username_22` (`username`),
  ADD UNIQUE KEY `email_22` (`email`),
  ADD UNIQUE KEY `username_23` (`username`),
  ADD UNIQUE KEY `email_23` (`email`),
  ADD UNIQUE KEY `username_24` (`username`),
  ADD UNIQUE KEY `email_24` (`email`),
  ADD UNIQUE KEY `username_25` (`username`),
  ADD UNIQUE KEY `email_25` (`email`),
  ADD UNIQUE KEY `username_26` (`username`),
  ADD UNIQUE KEY `email_26` (`email`),
  ADD UNIQUE KEY `username_27` (`username`),
  ADD UNIQUE KEY `email_27` (`email`),
  ADD UNIQUE KEY `username_28` (`username`),
  ADD UNIQUE KEY `email_28` (`email`),
  ADD UNIQUE KEY `username_29` (`username`),
  ADD UNIQUE KEY `email_29` (`email`),
  ADD UNIQUE KEY `username_30` (`username`),
  ADD UNIQUE KEY `email_30` (`email`),
  ADD KEY `roleId` (`roleId`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sessionId` (`sessionId`),
  ADD UNIQUE KEY `sessionId_2` (`sessionId`),
  ADD UNIQUE KEY `sessionId_3` (`sessionId`),
  ADD UNIQUE KEY `sessionId_4` (`sessionId`),
  ADD UNIQUE KEY `sessionId_5` (`sessionId`),
  ADD UNIQUE KEY `sessionId_6` (`sessionId`),
  ADD UNIQUE KEY `sessionId_7` (`sessionId`),
  ADD UNIQUE KEY `sessionId_8` (`sessionId`),
  ADD UNIQUE KEY `sessionId_9` (`sessionId`),
  ADD UNIQUE KEY `sessionId_10` (`sessionId`),
  ADD UNIQUE KEY `sessionId_11` (`sessionId`),
  ADD UNIQUE KEY `sessionId_12` (`sessionId`),
  ADD UNIQUE KEY `sessionId_13` (`sessionId`),
  ADD UNIQUE KEY `sessionId_14` (`sessionId`),
  ADD UNIQUE KEY `sessionId_15` (`sessionId`),
  ADD UNIQUE KEY `sessionId_16` (`sessionId`),
  ADD UNIQUE KEY `sessionId_17` (`sessionId`),
  ADD UNIQUE KEY `sessionId_18` (`sessionId`),
  ADD UNIQUE KEY `sessionId_19` (`sessionId`),
  ADD UNIQUE KEY `sessionId_20` (`sessionId`),
  ADD UNIQUE KEY `sessionId_21` (`sessionId`),
  ADD UNIQUE KEY `sessionId_22` (`sessionId`),
  ADD UNIQUE KEY `sessionId_23` (`sessionId`),
  ADD UNIQUE KEY `sessionId_24` (`sessionId`),
  ADD UNIQUE KEY `sessionId_25` (`sessionId`),
  ADD UNIQUE KEY `sessionId_26` (`sessionId`),
  ADD UNIQUE KEY `sessionId_27` (`sessionId`),
  ADD UNIQUE KEY `sessionId_28` (`sessionId`),
  ADD UNIQUE KEY `sessionId_29` (`sessionId`),
  ADD UNIQUE KEY `sessionId_30` (`sessionId`),
  ADD UNIQUE KEY `sessionId_31` (`sessionId`),
  ADD UNIQUE KEY `sessionId_32` (`sessionId`),
  ADD UNIQUE KEY `sessionId_33` (`sessionId`),
  ADD UNIQUE KEY `sessionId_34` (`sessionId`),
  ADD UNIQUE KEY `sessionId_35` (`sessionId`),
  ADD UNIQUE KEY `sessionId_36` (`sessionId`),
  ADD UNIQUE KEY `sessionId_37` (`sessionId`),
  ADD UNIQUE KEY `sessionId_38` (`sessionId`),
  ADD UNIQUE KEY `sessionId_39` (`sessionId`),
  ADD UNIQUE KEY `sessionId_40` (`sessionId`),
  ADD UNIQUE KEY `sessionId_41` (`sessionId`),
  ADD UNIQUE KEY `sessionId_42` (`sessionId`),
  ADD UNIQUE KEY `sessionId_43` (`sessionId`),
  ADD UNIQUE KEY `sessionId_44` (`sessionId`),
  ADD UNIQUE KEY `sessionId_45` (`sessionId`),
  ADD UNIQUE KEY `sessionId_46` (`sessionId`),
  ADD UNIQUE KEY `sessionId_47` (`sessionId`),
  ADD UNIQUE KEY `sessionId_48` (`sessionId`),
  ADD UNIQUE KEY `sessionId_49` (`sessionId`),
  ADD UNIQUE KEY `sessionId_50` (`sessionId`),
  ADD UNIQUE KEY `sessionId_51` (`sessionId`),
  ADD UNIQUE KEY `sessionId_52` (`sessionId`),
  ADD UNIQUE KEY `sessionId_53` (`sessionId`),
  ADD UNIQUE KEY `sessionId_54` (`sessionId`),
  ADD UNIQUE KEY `sessionId_55` (`sessionId`),
  ADD UNIQUE KEY `sessionId_56` (`sessionId`),
  ADD UNIQUE KEY `sessionId_57` (`sessionId`),
  ADD UNIQUE KEY `sessionId_58` (`sessionId`),
  ADD UNIQUE KEY `sessionId_59` (`sessionId`),
  ADD KEY `userId` (`userId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=95;

--
-- Constraints for dumped tables
--

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
