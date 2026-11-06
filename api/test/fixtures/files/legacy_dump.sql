-- Made-up sample in the shape of the old MariaDB dump (mariadb-dump output).
-- No real data: used by test/lib/legacy.
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET TIME_ZONE='+00:00' */;

DROP TABLE IF EXISTS `addresses`;
CREATE TABLE `addresses` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `street1` varchar(255) DEFAULT NULL,
  `street2` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `zip` varchar(255) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `addressee_id` bigint(20) DEFAULT NULL,
  `lastSent` varchar(255) DEFAULT NULL,
  `people_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES
(1,'1 Oak Lane',NULL,'Springfield','IL','62701','Gate code\'s 12, \"ring twice\"','2015-03-01 10:00:00','2023-12-01 18:30:00',1,'2023',NULL),
(2,'  2 Pine Road ','','Shelbyville','IL','62565',NULL,'2016-04-02 11:00:00','2016-04-02 11:00:00',5,NULL,NULL),
(3,'UNKNOWN',NULL,NULL,NULL,NULL,NULL,'2017-05-03 12:00:00','2017-05-03 12:00:00',NULL,NULL,NULL);
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

DROP TABLE IF EXISTS `people`;
CREATE TABLE `people` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `lastName` varchar(255) DEFAULT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `address_id` bigint(20) DEFAULT NULL,
  `parent_id` bigint(20) DEFAULT NULL,
  `spouse_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `suffix` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3;

LOCK TABLES `people` WRITE;
INSERT INTO `people` VALUES
(1,'O\'Neill','Ann',1,NULL,2,'2015-03-01 10:00:00','2015-03-01 10:00:00',''),
(2,'O\'Neill','Bob',NULL,NULL,NULL,'2015-03-01 10:01:00','2015-03-01 10:01:00','Jr.'),
(3,NULL,'Cara',NULL,2,NULL,'2015-03-01 10:02:00','2015-03-01 10:02:00',NULL),
(4,NULL,'Child 2',NULL,1,NULL,'2015-03-01 10:03:00','2015-03-01 10:03:00',NULL),
(5,'Müller','Zoë',2,NULL,99,'2016-04-02 11:00:00','2016-04-02 11:00:00',NULL),
(6,NULL,'Dana Smith',NULL,5,NULL,'2016-04-02 11:01:00','2016-04-02 11:01:00',NULL),
(7,'Loner','Lee',NULL,NULL,NULL,'2018-01-01 00:00:00','2018-01-01 00:00:00',NULL);
UNLOCK TABLES;
