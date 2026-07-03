# Troubleshooting & Best Practices Handbook

This guide contains solutions for common enterprise edge cases, hardware integration faults, and recommended strategies for maintaining a clean and efficient ERP environment.

---

## 1. Troubleshooting Common Errors

### 1.1 Login & Authentication Issues
- **Symptom:** User receives a `401 Unauthorized` or "Session Expired" error immediately after logging in.
- **Solution:** The JWT clock skew may be out of sync. Ensure the user's local PC time is set to "Automatic" via an NTP server. If the issue persists, the System Admin should clear the user's active sessions in `Admin -> Users -> Reset Sessions`.

### 1.2 Stuck Approval Workflows
- **Symptom:** A Purchase Order is "Pending Approval", but the designated manager did not receive a notification and cannot see it in their queue.
- **Solution:** Check the Workflow Rule engine. If the PO amount exactly matches the threshold (e.g., exactly `$10,000`), ensure the rule is `>=` and not just `>`. A System Admin can manually override and force-approve a stuck document via `Admin -> Workflow Recovery`.

### 1.3 Inventory & Stock Mismatches
- **Symptom:** The system says there are 50 pieces of steel, but the physical shelf is empty.
- **Solution:** Trace the Audit Log for that specific Item ID. Look for a Work Order that was executed but where the operator forgot to "Backflush" or declare material consumption. Run a `Stock Adjustment` to reconcile the inventory immediately to prevent production blocks.

### 1.4 Barcode Scanner & Hardware Issues
- **Symptom:** The USB barcode scanner reads a 12-digit Item Code, but the system reports "Item Not Found."
- **Solution:** Ensure the barcode scanner is programmed to transmit an `Enter` (Carriage Return) keystroke after the scan. Check if the scanner is inadvertently adding a hidden prefix character.

### 1.5 Machine Offline on Live Timeline
- **Symptom:** A CNC machine is physically running, but the Live Machine Timeline shows it as a grey "Offline" box.
- **Solution:** Check the local network connection to the IoT gateway box attached to the machine. Ensure the outbound port `443` (for WebSockets) is not blocked by the factory's firewall.

---

## 2. Enterprise Best Practices

Following these recommendations will ensure your ERP scales gracefully as your business grows.

### 2.1 Item Naming Conventions
Never use generic names like "Bolt". Establish a strict, standardized nomenclature:
- **Format:** `[Noun], [Adjective], [Size/Spec], [Material]`
- **Good:** `BOLT, HEX HEAD, M8x20, STAINLESS STEEL 304`
- **Bad:** `8mm bolt ss`

### 2.2 Warehouse Organization & Bins
- Do not dump all items into a single logical "Main Warehouse".
- Physically and logically divide your space into `Zones` (e.g., Raw Materials, Subassembly, Finished Goods) and map specific `Racks` and `Bins`. This drastically reduces the time it takes operators to pick materials for a Work Order.

### 2.3 BOM Revision Strategy
- **Never edit a Released BOM.** If a part requires a change on the shop floor, force the engineers to issue an Engineering Change Order (ECO) and release `Version 1.1`. Modifying a live BOM will corrupt historical cost calculations for items produced last month.

### 2.4 Security & Backup Hierarchy
- Implement the "Principle of Least Privilege". Do not give shop floor operators "Admin" access just because it is easier to setup.
- Verify your cloud backups weekly. Perform a simulated "Disaster Recovery" restore to a staging server every 6 months to guarantee business continuity.
