// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BitBeltSBT
 * @notice Soulbound ERC-721 tokens representing BJJ belt promotions on Base.
 *         Tokens are non-transferable: they can only be minted or burned.
 *         Only wallets with INSTRUCTOR_ROLE may mint.
 */
contract BitBeltSBT is ERC721, AccessControl {
    using Counters for Counters.Counter;

    // ─────────────────────────────── Roles ──────────────────────────────────
    bytes32 public constant INSTRUCTOR_ROLE = keccak256("INSTRUCTOR_ROLE");

    // ────────────────────────────── Metadata ────────────────────────────────
    enum BeltColor { White, Blue, Purple, Brown, Black }

    struct Promotion {
        BeltColor beltColor;
        uint40   promotionDate; // unix timestamp — fits in uint40 until year 36812
        address  instructor;
    }

    // tokenId → Promotion
    mapping(uint256 => Promotion) private _promotions;

    // student address → array of their token IDs (lineage)
    mapping(address => uint256[]) private _studentTokens;

    // ─────────────────────────────── State ──────────────────────────────────
    Counters.Counter private _tokenIdCounter;

    // ────────────────────────────── Events ──────────────────────────────────
    event BeltMinted(
        uint256 indexed tokenId,
        address indexed student,
        address indexed instructor,
        BeltColor beltColor,
        uint40 promotionDate
    );

    event BeltBurned(uint256 indexed tokenId, address indexed student);

    // ─────────────────────────── Constructor ────────────────────────────────
    constructor(address defaultAdmin) ERC721("BitBelt", "BBT") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(INSTRUCTOR_ROLE, defaultAdmin);
    }

    // ──────────────────────────── Soulbound ─────────────────────────────────
    /**
     * @dev Block all transfers except mints (from == address(0))
     *      and burns (to == address(0)).
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        require(
            from == address(0) || to == address(0),
            "BitBeltSBT: soulbound — token is non-transferable"
        );
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // ─────────────────────────────── Mint ───────────────────────────────────
    /**
     * @notice Mint a belt promotion SBT to a student.
     * @param student       Recipient wallet address.
     * @param beltColor     Belt color being awarded (0=White … 4=Black).
     * @param promotionDate Unix timestamp of the promotion ceremony.
     */
    function mintBelt(
        address student,
        BeltColor beltColor,
        uint40 promotionDate
    ) external onlyRole(INSTRUCTOR_ROLE) returns (uint256) {
        require(student != address(0), "BitBeltSBT: mint to zero address");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _promotions[tokenId] = Promotion({
            beltColor:     beltColor,
            promotionDate: promotionDate,
            instructor:    msg.sender
        });
        _studentTokens[student].push(tokenId);

        _safeMint(student, tokenId);

        emit BeltMinted(tokenId, student, msg.sender, beltColor, promotionDate);
        return tokenId;
    }

    // ─────────────────────────────── Burn ───────────────────────────────────
    /**
     * @notice Burn a belt token (e.g. revocation). Only the token owner
     *         or an admin may call this.
     */
    function burnBelt(uint256 tokenId) external {
        address owner = ownerOf(tokenId);
        require(
            msg.sender == owner || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "BitBeltSBT: not authorised to burn"
        );
        delete _promotions[tokenId];
        _burn(tokenId);
        emit BeltBurned(tokenId, owner);
    }

    // ──────────────────────────── Lineage reads ─────────────────────────────
    /**
     * @notice Return full promotion data for a token.
     */
    function getPromotion(uint256 tokenId)
        external
        view
        returns (Promotion memory)
    {
        require(_exists(tokenId), "BitBeltSBT: token does not exist");
        return _promotions[tokenId];
    }

    /**
     * @notice Return all token IDs owned by a student (their belt lineage).
     */
    function getLineage(address student)
        external
        view
        returns (uint256[] memory)
    {
        return _studentTokens[student];
    }

    // ──────────────────────────── Supportsinterface ─────────────────────────
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
