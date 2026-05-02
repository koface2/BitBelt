// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title  BitBeltSBT
 * @notice Soulbound ERC-721 tokens representing BJJ belt promotions on Base.
 *         Tokens are non-transferable: they can only be minted (from address(0))
 *         or burned (to address(0)).
 *         Only addresses with INSTRUCTOR_ROLE may mint.
 * @dev    Written for OpenZeppelin Contracts 5.0.  Uses the new _update hook
 *         (replaces the removed _beforeTokenTransfer) for soulbound enforcement.
 *         Token metadata is fully on-chain; promotionDate is stored as a unix
 *         timestamp so the frontend can sort/display the lineage timeline and
 *         convert to ISO-8601 with  new Date(ts * 1000).toISOString().
 */
contract BitBeltSBT is ERC721, AccessControl {
    using Strings for uint256;
    using Strings for address;

    // ─────────────────────────────── Roles ──────────────────────────────────

    bytes32 public constant INSTRUCTOR_ROLE = keccak256("INSTRUCTOR_ROLE");

    // ────────────────────────────── Metadata ────────────────────────────────

    /**
     * @dev On-chain promotion record attached to every token.
     *
     * promotionDate    — Unix timestamp (seconds) of the official ceremony.
     *                    Mirrors ISO-8601 on the frontend via
     *                    new Date(promotionDate * 1000).toISOString().
     * beltColor        — One of: "White" | "Blue" | "Purple" | "Brown" | "Black"
     * instructorAddress— Verified instructor wallet that issued the token.
     * studentName      — Human-readable name of the promoted student.
     * instructorName   — Human-readable name of the certifying instructor.
     */
    struct RankInfo {
        uint256 promotionDate;
        string  beltColor;
        address instructorAddress;
        string  studentName;
        string  instructorName;
    }

    /// @dev tokenId → RankInfo
    mapping(uint256 => RankInfo) private _rankInfo;

    /// @dev student → ordered list of token IDs (belt lineage, oldest first)
    mapping(address => uint256[]) private _studentTokens;

    // ─────────────────────────────── State ──────────────────────────────────

    /// @dev Token IDs start at 1; 0 is reserved to mean "no token".
    uint256 private _nextTokenId = 1;

    // ────────────────────────────── Events ──────────────────────────────────

    event BeltMinted(
        uint256 indexed tokenId,
        address indexed student,
        address indexed instructorAddress,
        string          beltColor,
        uint256         promotionDate,
        string          studentName,
        string          instructorName
    );

    event BeltBurned(uint256 indexed tokenId, address indexed student);

    // ─────────────────────────── Constructor ────────────────────────────────

    /**
     * @param defaultAdmin Address granted DEFAULT_ADMIN_ROLE and INSTRUCTOR_ROLE.
     *                     Should be a multisig (e.g. Safe) in production.
     */
    constructor(address defaultAdmin) ERC721("BitBelt", "BBT") {
        require(defaultAdmin != address(0), "BitBeltSBT: admin is zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(INSTRUCTOR_ROLE, defaultAdmin);
    }

    // ──────────────────────────── Soulbound ─────────────────────────────────

    /**
     * @dev OZ 5.0 unified transfer hook.  Reverts on any peer-to-peer transfer.
     *      Mints  (from == address(0)) and burns (to == address(0)) are allowed.
     *      Approval-based flows are therefore also blocked because every transfer
     *      path in ERC-721 routes through _update.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId); // address(0) when minting
        require(
            from == address(0) || to == address(0),
            "BitBeltSBT: soulbound - token is non-transferable"
        );
        return super._update(to, tokenId, auth);
    }

    // ─────────────────────────────── Mint ───────────────────────────────────

    /**
     * @notice Mint a belt promotion SBT to a student.
     * @param student            Recipient wallet address.
     * @param color              Belt color string — must be exactly one of:
     *                           "White", "Blue", "Purple", "Brown", "Black".
     * @param officialTimestamp  Unix timestamp of the official promotion ceremony.
     *                           Pass 0 to default to block.timestamp (live mints).
     *                           Pass a past timestamp for grandfathered promotions.
     *                           Future timestamps are rejected.
     * @param sName              Human-readable name of the promoted student.
     * @param iName              Human-readable name of the certifying instructor.
     * @return tokenId           The newly minted token ID.
     */
    function mintBelt(
        address student,
        string memory color,
        uint256 officialTimestamp,
        string memory sName,
        string memory iName
    ) external onlyRole(INSTRUCTOR_ROLE) returns (uint256 tokenId) {
        return _mintBeltInternal(student, color, officialTimestamp, msg.sender, sName, iName);
    }

    /**
     * @notice Admin-only variant of mintBelt that lets DEFAULT_ADMIN_ROLE
     *         specify the on-chain instructorAddress explicitly.
     *         Intended for backdating / testing: allows an admin to record a
     *         promotion as if it were issued by a specific instructor wallet.
     * @param instructor  Address to record as the certifying instructor.
     *                    Must not be zero address.
     * @param sName       Human-readable name of the promoted student.
     * @param iName       Human-readable name of the certifying instructor.
     */
    function mintBeltAs(
        address student,
        string memory color,
        uint256 officialTimestamp,
        address instructor,
        string memory sName,
        string memory iName
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256 tokenId) {
        require(instructor != address(0), "BitBeltSBT: instructor is zero address");
        return _mintBeltInternal(student, color, officialTimestamp, instructor, sName, iName);
    }

    /// @dev Shared minting logic used by both mintBelt and mintBeltAs.
    function _mintBeltInternal(
        address student,
        string memory color,
        uint256 officialTimestamp,
        address instructor,
        string memory sName,
        string memory iName
    ) internal returns (uint256 tokenId) {
        require(student != address(0), "BitBeltSBT: mint to zero address");
        _validateBeltColor(color); // also rejects empty strings

        uint256 promotionDate = (officialTimestamp == 0)
            ? block.timestamp
            : officialTimestamp;

        // Reject future-dated promotions — they cannot have been certified yet.
        require(
            promotionDate <= block.timestamp,
            "BitBeltSBT: promotion date cannot be in the future"
        );

        tokenId = _nextTokenId++;

        // Store rank data BEFORE the external _safeMint call
        // (Checks-Effects-Interactions pattern guards against re-entrancy).
        _rankInfo[tokenId] = RankInfo({
            promotionDate:     promotionDate,
            beltColor:         color,
            instructorAddress: instructor,
            studentName:       sName,
            instructorName:    iName
        });
        _studentTokens[student].push(tokenId);

        _safeMint(student, tokenId);

        emit BeltMinted(tokenId, student, instructor, color, promotionDate, sName, iName);
    }

    // ─────────────────────────────── Burn ───────────────────────────────────

    /**
     * @notice Burn a belt token (e.g. revocation or self-removal).
     *         Only the token owner or an address with DEFAULT_ADMIN_ROLE may call.
     * @dev    _rankInfo entry is deleted to reclaim storage.
     *         The token ID remains in _studentTokens as a ghost entry; callers
     *         should filter by existence (getRankInfo will revert for burned IDs).
     */
    function burnBelt(uint256 tokenId) external {
        // _requireOwned reverts with ERC721NonexistentToken if token is burned/never minted.
        address owner = _requireOwned(tokenId);
        require(
            msg.sender == owner || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "BitBeltSBT: not authorised to burn"
        );
        delete _rankInfo[tokenId];
        _burn(tokenId);
        emit BeltBurned(tokenId, owner);
    }

    // ─────────────────────────── Token URI ──────────────────────────────────

    /**
     * @notice Fully on-chain base64-encoded JSON metadata.
     *
     *         The `promotionDate` attribute uses OpenSea's `display_type: "date"`
     *         convention, which renders unix timestamps as human-readable dates in
     *         marketplaces.  On the BitBelt frontend, sort lineage by the raw
     *         numeric value and convert to ISO-8601 with:
     *           new Date(Number(promotionDate) * 1000).toISOString()
     *
     * @param tokenId  The token to query.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);
        RankInfo memory info = _rankInfo[tokenId];

        bytes memory attrs = abi.encodePacked(
            '{"trait_type":"Belt Color","value":"',       info.beltColor,         '"},'
            '{"trait_type":"Student","value":"',          info.studentName,        '"},'
            '{"trait_type":"Instructor","value":"',       info.instructorName,     '"},'
            '{"trait_type":"Instructor Address","value":"', Strings.toHexString(info.instructorAddress), '"},'
            '{"display_type":"date","trait_type":"Promotion Date","value":',
                info.promotionDate.toString(),
            '}'
        );

        bytes memory json = abi.encodePacked(
            '{"name":"BitBelt ',
            info.beltColor,
            ' Belt","description":"A verified Brazilian Jiu-Jitsu belt promotion credential. '
            'This Soulbound Token is permanently recorded on Base and cannot be transferred.",',
            '"attributes":[',
            attrs,
            ']}'
        );

        return string(
            abi.encodePacked("data:application/json;base64,", Base64.encode(json))
        );
    }

    // ──────────────────────────── Lineage reads ─────────────────────────────

    /**
     * @notice Return the full RankInfo record for a token.
     * @dev    Reverts with ERC721NonexistentToken if the token has been burned.
     */
    function getRankInfo(uint256 tokenId)
        external
        view
        returns (RankInfo memory)
    {
        _requireOwned(tokenId);
        return _rankInfo[tokenId];
    }

    /**
     * @notice Return all token IDs ever minted to a student, in mint order.
     * @dev    May include IDs for burned tokens (ghost entries).  Callers should
     *         call getRankInfo() for each ID and skip any that revert.
     */
    function getLineage(address student)
        external
        view
        returns (uint256[] memory)
    {
        return _studentTokens[student];
    }

    // ──────────────────────────── Internal helpers ───────────────────────────

    /**
     * @dev Revert if `color` is not one of the five recognised belt colours.
     *      Comparison is case-sensitive — callers must pass exact strings.
     */
    function _validateBeltColor(string memory color) internal pure {
        require(bytes(color).length > 0, "BitBeltSBT: empty belt color");
        bytes32 h = keccak256(bytes(color));
        require(
            h == keccak256(bytes("White"))  ||
            h == keccak256(bytes("Blue"))   ||
            h == keccak256(bytes("Purple")) ||
            h == keccak256(bytes("Brown"))  ||
            h == keccak256(bytes("Black")),
            "BitBeltSBT: invalid belt color"
        );
    }

    // ────────────────────────── supportsInterface ────────────────────────────

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
