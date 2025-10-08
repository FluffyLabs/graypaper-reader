#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emojis
SUCCESS="✅"
FAILURE="❌"
INFO="💡"
REPORT="📊"

echo -e "${BLUE}🚀 Running Playwright snapshot tests...${NC}"
echo ""

# Run the Docker tests
docker-compose run --rm snapshot-tests

# Capture the exit code
TEST_EXIT_CODE=$?

echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}${SUCCESS} All tests passed successfully!${NC}"
else
    echo -e "${RED}${FAILURE} Tests failed!${NC}"
    echo ""
    echo -e "${YELLOW}${REPORT} View the detailed test report:${NC}"
    echo -e "   ${BLUE}tools/snapshot-tests/playwright-report/index.html${NC}"
    echo ""
    echo -e "${YELLOW}${INFO} Tips:${NC}"
    echo -e "   • Open the report in your browser to see screenshots and failure details"
    echo -e "   • Check the 'test-results' folder for individual test artifacts"
    echo -e "   • Run 'npm run docker:test:update' to update snapshots if needed"
    echo ""

    # Check if the report directory exists and has content
    if [ -d "tools/snapshot-tests/playwright-report" ] && [ "$(ls -A tools/snapshot-tests/playwright-report)" ]; then
        echo -e "${INFO} Report is ready to view!"
    else
        echo -e "${YELLOW}⚠️  Report directory not found. Tests may have failed to generate a report.${NC}"
    fi

    echo ""
fi

exit $TEST_EXIT_CODE
