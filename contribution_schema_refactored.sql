-- SQL Schema for Contribution Form Data (Refactored)
-- Renamed Artifacts to ContributionArtifacts to avoid conflict with inventory system
-- File uploads stored as JSON text fields following Article system pattern

-- Table: Contributors
CREATE TABLE Contributors (
    contributor_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    age INT,
    phone_number VARCHAR(20) NOT NULL,
    sex ENUM('male', 'female', 'other') NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    organization VARCHAR(255),
    province VARCHAR(255) NOT NULL,
    barangay VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    street VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: Contributions
CREATE TABLE Contributions (
    contribution_id INT PRIMARY KEY AUTO_INCREMENT,
    contributor_id INT NOT NULL,
    contribution_type ENUM('lending', 'donation') NOT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contributor_id) REFERENCES Contributors(contributor_id)
);

-- Table: LendingDetails
CREATE TABLE LendingDetails (
    lending_id INT PRIMARY KEY AUTO_INCREMENT,
    contribution_id INT NOT NULL UNIQUE,
    duration VARCHAR(255) NOT NULL,
    display_handling_condition TEXT NOT NULL,
    liability_concerns TEXT NOT NULL,
    lending_reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contribution_id) REFERENCES Contributions(contribution_id) ON DELETE CASCADE
);

-- Table: ContributionArtifacts
CREATE TABLE ContributionArtifacts (
    artifact_id INT PRIMARY KEY AUTO_INCREMENT,
    contribution_id INT NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    acquisition_details TEXT NOT NULL,
    other_info TEXT,
    narrative_story TEXT,
    images TEXT, -- JSON array of image filenames
    documents TEXT, -- JSON array of document filenames
    related_images TEXT, -- JSON array of related image filenames
    image_urls TEXT, -- JSON array of image URLs (optional)
    document_urls TEXT, -- JSON array of document URLs (optional)
    related_image_urls TEXT, -- JSON array of related image URLs (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contribution_id) REFERENCES Contributions(contribution_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_contributor_email ON Contributors(email);
CREATE INDEX idx_contribution_contributor_id ON Contributions(contributor_id);
CREATE INDEX idx_contribution_status ON Contributions(status);
CREATE INDEX idx_lending_contribution_id ON LendingDetails(contribution_id);
CREATE INDEX idx_artifact_contribution_id ON ContributionArtifacts(contribution_id);
