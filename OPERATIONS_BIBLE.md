# ToolRoomOS Indian Toolroom Operations Bible
Version: 1.0
Status: OFFICIAL
Classification: Manufacturing Operations Standard

================================================================================
PURPOSE
================================================================================

This document defines how real Indian toolrooms operate.

ToolRoomOS must model the factory.

The factory must never adapt to the software.

Every workflow,
every document,
every calculation,
every dashboard,
every report,
must reflect how actual Indian toolrooms work.

This document intentionally ignores software.

It describes reality.

================================================================================
WHAT MAKES A TOOLROOM DIFFERENT
================================================================================

A toolroom is NOT mass manufacturing.

A toolroom manufactures

Low Volume

High Complexity

Engineer-to-Order products.

Examples

Injection Mould

Press Tool

Fixture

Gauge

Jig

Special Purpose Machine Parts

Prototype Components

Development Parts

Every project is different.

Every BOM changes.

Every routing changes.

Every drawing changes.

Every machining sequence changes.

Therefore,

flexibility is mandatory.

================================================================================
THE GOLDEN RULE
================================================================================

Manufacturing never stops because software says so.

If engineering is incomplete,

production may still begin.

If material has not arrived,

another operation may continue.

If QC is delayed,

assembly may continue.

If invoice is pending,

dispatch may still occur.

Software records reality.

Software never dictates reality.

================================================================================
DEPARTMENTS
================================================================================

Every toolroom consists of interconnected departments.

Sales

↓

Engineering

↓

Planning

↓

Purchase

↓

Stores

↓

Production

↓

Quality

↓

Assembly

↓

Dispatch

↓

Finance

Each department owns documents.

No department owns another department.

================================================================================
ENGINEERING DEPARTMENT
================================================================================

Purpose

Define WHAT must be manufactured.

Inputs

Customer Drawing

Customer PO

Technical Discussion

Outputs

Project

BOM

Routing

Material Specification

Drawings

Revision

Attachments

Engineering Cost Estimate

Engineering Responsibilities

Understand drawing

Break product into parts

Estimate material

Estimate machining

Estimate time

Estimate cost

Select machines

Select inspection methods

Define tolerances

Engineering NEVER

Purchases material

Issues stock

Runs production

Records machine hours

================================================================================
PLANNING DEPARTMENT
================================================================================

Purpose

Convert engineering into executable work.

Inputs

Approved Engineering

Machine Availability

Operator Availability

Delivery Commitment

Outputs

Production Plan

Machine Allocation

Operator Allocation

Target Dates

Priorities

Planning adjusts

Machine

Operator

Schedule

Sequence

Planning never changes engineering.

================================================================================
PURCHASE DEPARTMENT
================================================================================

Purpose

Procure everything required.

Inputs

Material Requirement

Vendor

Rates

Delivery

Outputs

Purchase Order

Vendor Follow-up

Commercial Tracking

Purchase verifies

Rate

GST

Delivery

Material Grade

Mill Certificate

Vendor Performance

Purchase NEVER updates inventory.

================================================================================
STORES DEPARTMENT
================================================================================

Purpose

Manage physical inventory.

Stores owns

GRN

Material Issue

Stock

Rack

Bin

Warehouse

Offcuts

Heat Numbers

Stores Responsibilities

Receive material

Inspect quantity

Assign batches

Assign rack

Issue material

Return material

Track offcuts

Maintain stock accuracy

Stores NEVER changes engineering.

================================================================================
PRODUCTION DEPARTMENT
================================================================================

Purpose

Convert raw material into finished parts.

Production owns

Machine Planning

Machine Execution

MSDR

Job Cards

Operator Hours

Machine Hours

Downtime

Production Cost

Production Responsibilities

Load machines

Assign operators

Execute routing

Record production

Record downtime

Record rejection

Record setup

Record completion

Production NEVER edits BOM.

================================================================================
QUALITY DEPARTMENT
================================================================================

Purpose

Measure quality.

Quality owns

Inspection

Measurements

Calibration

NCR

Rework

Quality Responsibilities

Incoming Inspection

In-process Inspection

Final Inspection

Calibration

NCR

Quality NEVER changes production quantities.

================================================================================
ASSEMBLY DEPARTMENT
================================================================================

Purpose

Assemble manufactured parts.

Assembly owns

Assembly Progress

Fitment

Missing Parts

Assembly Status

Assembly does not machine parts.

Assembly combines them.

================================================================================
DISPATCH DEPARTMENT
================================================================================

Purpose

Deliver finished goods.

Dispatch owns

Packing

Vehicle

Transport

LR Number

Dispatch Quantity

Boxes

Weight

Dispatch never changes production.

================================================================================
FINANCE DEPARTMENT
================================================================================

Purpose

Understand money.

Finance does NOT own manufacturing.

Finance consumes

Purchase

Production

Dispatch

Vendor Bills

Invoices

Payments

Finance answers

How much spent?

How much earned?

How much profit?

Finance never invents numbers.

================================================================================
THE LIFE OF A PROJECT
================================================================================

Customer PO

↓

Project

↓

Engineering

↓

Material Planning

↓

Purchase

↓

GRN

↓

Inventory

↓

Material Issue

↓

Production Planning

↓

MSDR

↓

Inspection

↓

Assembly

↓

Trial

↓

Final Inspection

↓

Dispatch

↓

Invoice

↓

Payment

↓

Closure

This is informational.

Documents remain independent.

================================================================================
REAL FACTORY EXCEPTIONS
================================================================================

Customer changes drawing

↓

Engineering Revision

Material delayed

↓

Production resequencing

Machine breakdown

↓

Planning changes machine

Operator absent

↓

Planning reallocates operator

Urgent order

↓

Priority override

Material shortage

↓

Partial issue

Wrong material received

↓

GRN rejection

Wrong machining

↓

NCR

↓

Rework

Customer trial failed

↓

Engineering Revision

↓

Production Restart

Software must support all these situations.

================================================================================
MSDR PHILOSOPHY
================================================================================

MSDR is the heartbeat.

Everything important happens here.

MSDR records

Machine

Operator

Project

Drawing

Operation

Qty

Hours

Downtime

Rejection

Tool Change

Machine Condition

Production Cost

Nothing else should duplicate this information.

================================================================================
OFFCUT MANAGEMENT
================================================================================

Indian toolrooms reuse steel.

Offcuts have value.

Every offcut records

Parent Material

Dimensions

Heat Number

Remaining Weight

Rack

Availability

Offcuts behave like inventory.

================================================================================
HEAT NUMBER TRACEABILITY
================================================================================

Every critical material records

Supplier

Heat Number

Batch

Mill Certificate

GRN

Material Issue

Production

Inspection

Dispatch

Complete traceability.

================================================================================
REWORK
================================================================================

Rework is normal.

Never delete production.

Record

Original

Rework

Reason

Hours

Cost

Reworked Qty

ToolRoomOS must calculate true cost.

================================================================================
MACHINE COST
================================================================================

Machine Cost comes from

Machine Hourly Rate

×

Actual Running Hours

Not estimated hours.

================================================================================
LABOUR COST
================================================================================

Labour Cost comes from

Employee Hourly Rate

×

Actual Hours

Not attendance.

================================================================================
PROJECT COST
================================================================================

Project Cost equals

Material

+

Machine

+

Labour

+

Subcontract

+

Inspection

+

Dispatch

+

Miscellaneous

Everything comes from documents.

Nothing manual.

================================================================================
PROFIT
================================================================================

Profit equals

Invoice Value

−

Actual Project Cost

Always live.

Always recalculated.

================================================================================
THE INDIAN REALITY
================================================================================

Indian toolrooms frequently experience

Drawing revisions

Urgent jobs

Material substitutions

Manual approvals

Machine breakdowns

Operator changes

Late deliveries

Partial dispatches

Trial failures

Repeat machining

Customer visits

Vendor delays

Software must embrace these realities.

Never fight them.

================================================================================
THE FINAL PRINCIPLE
================================================================================

Factories are dynamic.

Software must be flexible.

Documents provide truth.

History provides accountability.

Automation provides speed.

Humans remain in control.

ToolRoomOS exists to amplify the factory,
not replace its people.

================================================================================
END OF DOCUMENT
================================================================================
