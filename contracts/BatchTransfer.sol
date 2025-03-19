// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BatchTransfer
 * @dev A simple contract for batch sending ETH and ERC20 tokens
 */
contract BatchTransfer {
    using SafeERC20 for IERC20;
    
    // Event emitted when a multisend operation is completed
    event MultiSendExecuted(
        address indexed sender,
        address tokenAddress,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    /**
     * @dev Sends native ETH to multiple recipients in a single transaction
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send to each recipient
     */
    function multiSendETH(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable {
        require(recipients.length == amounts.length, "Recipients and amounts arrays must be the same length");
        require(recipients.length > 0, "Must provide at least one recipient");
        
        uint256 totalAmount = 0;
        
        // Calculate total amount
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        // Verify sent ETH matches total amount
        require(msg.value == totalAmount, "Sent ETH value must match total amount");
        
        // Process transfers
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            
            (bool success, ) = recipients[i].call{value: amounts[i]}("");
            require(success, "ETH transfer failed");
        }
        
        emit MultiSendExecuted(msg.sender, address(0), totalAmount, recipients.length);
    }
    
    /**
     * @dev Sends ERC20 tokens to multiple recipients in a single transaction
     * @param token Address of the ERC20 token
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send to each recipient
     */
    function multiSendToken(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        require(token != address(0), "Invalid token address");
        require(recipients.length == amounts.length, "Recipients and amounts arrays must be the same length");
        require(recipients.length > 0, "Must provide at least one recipient");
        
        IERC20 erc20 = IERC20(token);
        uint256 totalAmount = 0;
        
        // Calculate total amount
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        // Check if sender has sufficient allowance
        require(
            erc20.allowance(msg.sender, address(this)) >= totalAmount,
            "Insufficient token allowance"
        );
        
        // Process transfers
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(amounts[i] > 0, "Amount must be greater than 0");
            
            // Transfer tokens from sender to recipient
            erc20.safeTransferFrom(msg.sender, recipients[i], amounts[i]);
        }
        
        emit MultiSendExecuted(msg.sender, token, totalAmount, recipients.length);
    }
    
    /**
     * @dev Batch send multiple different ERC20 tokens to a single recipient
     * @param tokens Array of token addresses
     * @param recipient The recipient address
     * @param amounts Array of amounts to send
     */
    function multiTokenTransfer(
        address[] calldata tokens,
        address recipient,
        uint256[] calldata amounts
    ) external {
        require(tokens.length == amounts.length, "Tokens and amounts arrays must be the same length");
        require(tokens.length > 0, "Must provide at least one token");
        require(recipient != address(0), "Invalid recipient address");
        
        // Process transfers
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token address");
            require(amounts[i] > 0, "Amount must be greater than 0");
            
            IERC20 erc20 = IERC20(tokens[i]);
            
            // Check if sender has sufficient allowance for this token
            require(
                erc20.allowance(msg.sender, address(this)) >= amounts[i],
                "Insufficient token allowance"
            );
            
            // Transfer tokens from sender to recipient
            erc20.safeTransferFrom(msg.sender, recipient, amounts[i]);
            
            emit MultiSendExecuted(msg.sender, tokens[i], amounts[i], 1);
        }
    }
    
    // Allow contract to receive ETH for multiSendETH function
    receive() external payable {
        // This function is called when ETH is sent with empty calldata
        // We want to prevent direct ETH transfers to protect users from accidentally sending ETH
        revert("Direct ETH transfers not allowed");
    }
    
    // Fallback function to handle any other ETH transfers
    fallback() external payable {
        // This function is called when ETH is sent with non-empty calldata
        // We also want to prevent these transfers for the same reason
        revert("Direct ETH transfers not allowed");
    }
}