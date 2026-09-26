/*
 * Fictional demo inputs for Mandate's deal analysis.
 * No borrower or lender data in this file represents a real person or business.
 * Load this file before deal-analysis.js in a browser.
 */
(function (global) {
  "use strict";

  const deals = [
    {
      id: "demo-northstar-civil",
      synthetic: true,
      createdAt: "2026-09-25T09:00:00+12:00",
      company: {
        name: "Northstar Civil Ltd",
        industry: "Civil construction",
        location: "Wellington, New Zealand"
      },
      funding: {
        currency: "NZD",
        amount: 2400000,
        purpose: "Business acquisition and equipment",
        termMonths: 36,
        preferredTiming: "Within 8 weeks",
        security: ["Commercial property", "Equipment"]
      },
      financials: {
        annualRevenue: {
          amount: 5200000,
          currency: "NZD",
          periodEnd: "2025-03-31",
          sourceIds: ["northstar-management-accounts"]
        },
        ebitda: {
          amount: 820000,
          currency: "NZD",
          periodEnd: "2025-03-31",
          sourceIds: ["northstar-management-accounts"]
        }
      },
      documents: [
        {
          id: "northstar-company-overview",
          name: "Company overview",
          kind: "company_overview",
          sourceType: "synthetic_sample",
          status: "provided",
          extractedFields: [
            { field: "company.name", value: "Northstar Civil Ltd" },
            { field: "company.industry", value: "Civil construction" },
            { field: "company.location", value: "Wellington, New Zealand" }
          ]
        },
        {
          id: "northstar-management-accounts",
          name: "FY2025 management accounts",
          kind: "management_accounts",
          sourceType: "synthetic_sample",
          status: "provided",
          periodEnd: "2025-03-31",
          extractedFields: [
            { field: "financials.annualRevenue", value: 5200000, currency: "NZD" },
            { field: "financials.ebitda", value: 820000, currency: "NZD" }
          ]
        },
        {
          id: "northstar-equipment-schedule",
          name: "Equipment schedule",
          kind: "asset_schedule",
          sourceType: "synthetic_sample",
          status: "provided",
          extractedFields: [
            { field: "funding.security", value: "Equipment" }
          ]
        },
        {
          id: "northstar-property-valuation",
          name: "Property valuation",
          kind: "valuation",
          sourceType: "synthetic_sample",
          status: "missing",
          extractedFields: []
        }
      ],
      review: {
        confirmedFields: [
          "company.name",
          "company.industry",
          "company.location",
          "funding.amount",
          "funding.purpose",
          "funding.termMonths"
        ],
        conflicts: []
      },
      workflow: { stage: "draft" }
    },
    {
      id: "demo-harbour-pine-foods",
      synthetic: true,
      createdAt: "2026-09-25T09:15:00+12:00",
      company: {
        name: "Harbour & Pine Foods Ltd",
        industry: "Food manufacturing",
        location: "Auckland, New Zealand"
      },
      funding: {
        currency: "NZD",
        amount: 850000,
        purpose: "Seasonal working capital",
        termMonths: 24,
        preferredTiming: null,
        security: ["Inventory", "Director support"]
      },
      financials: {
        annualRevenue: {
          amount: 3100000,
          currency: "NZD",
          periodEnd: "2025-03-31",
          sourceIds: ["harbour-pine-accounts"]
        },
        ebitda: {
          amount: 410000,
          currency: "NZD",
          periodEnd: "2025-03-31",
          sourceIds: ["harbour-pine-accounts"]
        }
      },
      documents: [
        {
          id: "harbour-pine-overview",
          name: "Company overview",
          kind: "company_overview",
          sourceType: "synthetic_sample",
          status: "provided",
          extractedFields: [
            { field: "company.name", value: "Harbour & Pine Foods Ltd" },
            { field: "company.industry", value: "Food manufacturing" },
            { field: "company.location", value: "Auckland, New Zealand" }
          ]
        },
        {
          id: "harbour-pine-accounts",
          name: "FY2025 management accounts",
          kind: "management_accounts",
          sourceType: "synthetic_sample",
          status: "provided",
          periodEnd: "2025-03-31",
          extractedFields: [
            { field: "financials.annualRevenue", value: 3100000, currency: "NZD" },
            { field: "financials.ebitda", value: 410000, currency: "NZD" }
          ]
        },
        {
          id: "harbour-pine-sales-forecast",
          name: "Sales forecast",
          kind: "sales_forecast",
          sourceType: "synthetic_sample",
          status: "provided",
          extractedFields: []
        },
        {
          id: "harbour-pine-inventory-schedule",
          name: "Inventory schedule",
          kind: "inventory_schedule",
          sourceType: "synthetic_sample",
          status: "missing",
          extractedFields: []
        }
      ],
      review: {
        confirmedFields: ["company.name", "funding.amount", "funding.purpose"],
        conflicts: []
      },
      workflow: { stage: "draft" }
    },
    {
      id: "demo-ridgeway-equipment",
      synthetic: true,
      createdAt: "2026-09-25T09:30:00+12:00",
      company: {
        name: "Ridgeway Equipment Ltd",
        industry: "Agricultural services",
        location: "Canterbury, New Zealand"
      },
      funding: {
        currency: "NZD",
        amount: 1200000,
        purpose: "Equipment purchase",
        termMonths: 48,
        preferredTiming: "Within 12 weeks",
        security: ["Equipment being financed"]
      },
      financials: {
        annualRevenue: {
          amount: 4600000,
          currency: "NZD",
          periodEnd: "2025-03-31",
          sourceIds: ["ridgeway-accounts"]
        },
        ebitda: {
          amount: 690000,
          currency: "NZD",
          periodEnd: "2025-03-31",
          sourceIds: ["ridgeway-accounts"]
        }
      },
      documents: [
        {
          id: "ridgeway-overview",
          name: "Company overview",
          kind: "company_overview",
          sourceType: "synthetic_sample",
          status: "provided",
          extractedFields: [
            { field: "company.name", value: "Ridgeway Equipment Ltd" },
            { field: "company.industry", value: "Agricultural services" },
            { field: "company.location", value: "Canterbury, New Zealand" }
          ]
        },
        {
          id: "ridgeway-accounts",
          name: "FY2025 management accounts",
          kind: "management_accounts",
          sourceType: "synthetic_sample",
          status: "provided",
          periodEnd: "2025-03-31",
          extractedFields: [
            { field: "financials.annualRevenue", value: 4600000, currency: "NZD" },
            { field: "financials.ebitda", value: 690000, currency: "NZD" }
          ]
        },
        {
          id: "ridgeway-equipment-quote",
          name: "Equipment quote",
          kind: "equipment_quote",
          sourceType: "synthetic_sample",
          status: "provided",
          extractedFields: [
            { field: "funding.purpose", value: "Equipment purchase" },
            { field: "funding.security", value: "Equipment being financed" }
          ]
        },
        {
          id: "ridgeway-cashflow-forecast",
          name: "Cash flow forecast",
          kind: "cash_flow_forecast",
          sourceType: "synthetic_sample",
          status: "missing",
          extractedFields: []
        }
      ],
      review: {
        confirmedFields: ["company.name", "funding.amount", "funding.purpose"],
        conflicts: []
      },
      workflow: { stage: "draft" }
    }
  ];

  const lenders = [
    {
      id: "demo-kauri-capital",
      name: "Kauri Capital",
      synthetic: true,
      criteriaAsAt: "Illustrative demo criteria",
      criteria: {
        amountNZD: { minimum: 1000000, maximum: 5000000 },
        purposes: ["business acquisition", "equipment purchase", "business acquisition and equipment"],
        securityAny: ["commercial property", "equipment"],
        termMonths: { minimum: 12, maximum: 60 }
      }
    },
    {
      id: "demo-harbour-funding",
      name: "Harbour Funding",
      synthetic: true,
      criteriaAsAt: "Illustrative demo criteria",
      criteria: {
        amountNZD: { minimum: 500000, maximum: 3000000 },
        purposes: ["working capital", "seasonal working capital"],
        securityAny: ["commercial property", "inventory", "director support"],
        termMonths: { minimum: 6, maximum: 36 }
      }
    },
    {
      id: "demo-tui-credit-partners",
      name: "Tui Credit Partners",
      synthetic: true,
      criteriaAsAt: "Illustrative demo criteria",
      criteria: {
        amountNZD: { minimum: 250000, maximum: 2000000 },
        purposes: ["equipment purchase", "asset purchase"],
        securityAny: ["equipment", "equipment being financed"],
        termMonths: { minimum: 12, maximum: 60 }
      }
    }
  ];

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  global.MandateSyntheticData = Object.freeze({
    deals: copy(deals),
    lenders: copy(lenders),
    getDeal: function (id) {
      const deal = deals.find(function (item) { return item.id === id; });
      return deal ? copy(deal) : null;
    },
    getLenders: function () { return copy(lenders); }
  });
})(window);
