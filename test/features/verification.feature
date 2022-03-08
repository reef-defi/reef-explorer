Feature: Verification

	Scenario: Contract Verification
        Given I deploy a contract using hardhat
		When I verify a contract using hardhat
		Then The verification API endpoint should succesfully respond with verified contract data to HTTP request