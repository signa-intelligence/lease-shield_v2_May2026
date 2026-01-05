// ============================================================================
// CLAUSE LEDGER AUTOMATED TESTS
// Validates: (1) 100% coverage (2) review count match (3) schema validation
// ============================================================================

import { CANONICAL_CLAUSE_CATALOG } from './canonicalClauseCatalog.js';

// Test 1: Clause coverage - every extracted clause must have a review
function testClauseCoverage(report) {
  const results = {
    test: 'CLAUSE_COVERAGE_100PCT',
    passed: true,
    errors: []
  };
  
  if (!report.clause_ledger || !report.clause_review) {
    results.passed = false;
    results.errors.push('Missing clause_ledger or clause_review');
    return results;
  }
  
  const ledgerIds = new Set(report.clause_ledger.map(c => c.clause_id));
  const reviewIds = new Set(report.clause_review.map(r => r.clause_id));
  
  // Every ledger item must have a review
  for (const id of ledgerIds) {
    if (!reviewIds.has(id)) {
      results.passed = false;
      results.errors.push(`Clause ${id} in ledger but not in review`);
    }
  }
  
  // Every review must correspond to a ledger item
  for (const id of reviewIds) {
    if (!ledgerIds.has(id)) {
      results.passed = false;
      results.errors.push(`Clause ${id} in review but not in ledger`);
    }
  }
  
  return results;
}

// Test 2: Count match - clause_review.length must equal clause_ledger.length
function testCountMatch(report) {
  const results = {
    test: 'REVIEW_COUNT_EQUALS_LEDGER_COUNT',
    passed: true,
    errors: []
  };
  
  const ledgerCount = report.clause_ledger?.length || 0;
  const reviewCount = report.clause_review?.length || 0;
  
  if (ledgerCount !== reviewCount) {
    results.passed = false;
    results.errors.push(`Count mismatch: ledger=${ledgerCount}, review=${reviewCount}`);
  }
  
  return results;
}

// Test 3: Schema validation - all required fields present
function testSchemaValidation(report) {
  const results = {
    test: 'SCHEMA_VALIDATION',
    passed: true,
    errors: []
  };
  
  // Top-level required fields
  const requiredFields = [
    'scan_version', 'canonical_clause_catalog', 'clause_ledger',
    'mappings', 'clause_review', 'missing_clauses', 'summary'
  ];
  
  for (const field of requiredFields) {
    if (!(field in report)) {
      results.passed = false;
      results.errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate clause_ledger items
  if (Array.isArray(report.clause_ledger)) {
    report.clause_ledger.forEach((cl, idx) => {
      if (!cl.clause_id) {
        results.passed = false;
        results.errors.push(`clause_ledger[${idx}] missing clause_id`);
      }
      if (!cl.full_text) {
        results.passed = false;
        results.errors.push(`clause_ledger[${idx}] missing full_text`);
      }
    });
  }
  
  // Validate clause_review items
  if (Array.isArray(report.clause_review)) {
    const requiredReviewFields = [
      'clause_id', 'risk_level', 'risk_summary',
      'tenant_view', 'landlord_view', 'lawyer_view'
    ];
    
    report.clause_review.forEach((cr, idx) => {
      for (const field of requiredReviewFields) {
        if (!(field in cr)) {
          results.passed = false;
          results.errors.push(`clause_review[${idx}] missing ${field}`);
        }
      }
      
      // Validate risk_level enum
      if (!['none', 'low', 'medium', 'high'].includes(cr.risk_level)) {
        results.passed = false;
        results.errors.push(`clause_review[${idx}] invalid risk_level: ${cr.risk_level}`);
      }
    });
  }
  
  // Validate mappings
  if (Array.isArray(report.mappings)) {
    report.mappings.forEach((m, idx) => {
      if (!m.clause_id) {
        results.passed = false;
        results.errors.push(`mappings[${idx}] missing clause_id`);
      }
      if (!Array.isArray(m.mapped_catalog_ids)) {
        results.passed = false;
        results.errors.push(`mappings[${idx}] missing mapped_catalog_ids array`);
      }
    });
  }
  
  // Validate summary
  if (report.summary) {
    const summaryFields = ['total_extracted', 'total_catalog', 'mapped_pct'];
    for (const field of summaryFields) {
      if (typeof report.summary[field] !== 'number') {
        results.passed = false;
        results.errors.push(`summary.${field} must be a number`);
      }
    }
  }
  
  return results;
}

// Test 4: Catalog integrity
function testCatalogIntegrity() {
  const results = {
    test: 'CATALOG_INTEGRITY',
    passed: true,
    errors: []
  };
  
  const ids = new Set();
  
  CANONICAL_CLAUSE_CATALOG.forEach((cat, idx) => {
    // Check unique IDs
    if (ids.has(cat.id)) {
      results.passed = false;
      results.errors.push(`Duplicate catalog ID: ${cat.id}`);
    }
    ids.add(cat.id);
    
    // Check required fields
    if (!cat.id || !cat.canonical_name || !cat.purpose) {
      results.passed = false;
      results.errors.push(`Catalog[${idx}] missing required fields`);
    }
    
    // Check ID format
    if (!cat.id.startsWith('CAT-')) {
      results.passed = false;
      results.errors.push(`Catalog ID ${cat.id} doesn't match CAT-XXX format`);
    }
  });
  
  // Minimum catalog size
  if (CANONICAL_CLAUSE_CATALOG.length < 40) {
    results.passed = false;
    results.errors.push(`Catalog too small: ${CANONICAL_CLAUSE_CATALOG.length} < 40 minimum`);
  }
  
  return results;
}

// Run all tests on a report
export function runAllTests(report) {
  const allResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { passed: 0, failed: 0 }
  };
  
  // Run tests
  const tests = [
    testCatalogIntegrity(),
    testClauseCoverage(report),
    testCountMatch(report),
    testSchemaValidation(report)
  ];
  
  tests.forEach(result => {
    allResults.tests.push(result);
    if (result.passed) {
      allResults.summary.passed++;
    } else {
      allResults.summary.failed++;
    }
  });
  
  allResults.all_passed = allResults.summary.failed === 0;
  
  return allResults;
}

// Deno serve endpoint for running tests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  
  try {
    const body = await req.json();
    const { report } = body;
    
    if (!report) {
      // Just run catalog integrity test
      const catalogTest = testCatalogIntegrity();
      return Response.json({
        success: true,
        results: {
          tests: [catalogTest],
          summary: { passed: catalogTest.passed ? 1 : 0, failed: catalogTest.passed ? 0 : 1 },
          all_passed: catalogTest.passed
        }
      });
    }
    
    const results = runAllTests(report);
    
    return Response.json({
      success: true,
      results
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});