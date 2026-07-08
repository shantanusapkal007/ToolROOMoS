# ToolRoomOS Calculation Library

This document contains the core business formulas extracted from legacy logic and business requirements. It serves as the single source of truth for all calculations in ToolRoomOS.

## 1. Material Cost Formula
*(To be detailed by Business)*
`Material Cost = (Raw Material Quantity * Unit Price) + Freight Cost + Handling Percentage`

## 2. Machine Cost Formula
*(To be detailed by Business)*
`Machine Cost = Machine Setup Time + (Machining Cycle Time * Hourly Rate of Machine)`

## 3. Labour Cost Formula
*(To be detailed by Business)*
`Labour Cost = Total Manual Hours * Hourly Operator Rate`

## 4. Outside Process Formula
*(To be detailed by Business)*
`Outside Process Cost = Subcontractor Quote + Transport Costs + Handling Overhead`

## 5. Heat Treatment Formula
*(To be detailed by Business)*
`Heat Treatment Cost = (Weight of Batch * Rate per KG) + Setup Charge`

## 6. Packing Formula
*(To be detailed by Business)*
`Packing Cost = Base Material Cost + Specialized Crating Cost + Labour`

## 7. Dispatch Formula
*(To be detailed by Business)*
`Dispatch Cost = Freight Provider Quote + Transit Insurance`

## 8. GST Formula
*(Derived from Sales Pricing Engine)*
`GST = (Net Price + All Base Costs) * Applicable GST Rate (%)`

## 9. Profit Formula
*(Derived from Sales Pricing Engine)*
`Profit Margin = (Net Sales Price - Total Simulated/Actual Cost) / Net Sales Price`

## 10. Project Cost Formula
*(Derived from API and DB Schema)*
`Total Project Cost = Material Cost + Machine Cost + Labour Cost + Outside Process + Heat Treatment + Packing + Dispatch + Overheads`

---
*Note: These formulas were partially extracted from `backend/modules/sales/domain/cpq/pricing_engine.go` and placeholder schemas. They require review by domain experts for specific manufacturing multipliers and efficiency factors.*
