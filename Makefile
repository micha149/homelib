
MOCHA_OPTS=
REPORTER = list

check: test

test: test-unit

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-cov: lib-cov
	@EXPRESS_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov: clean
	./node_modules/visionmedia-jscoverage/jscoverage \
	src src-cov

clean:
	rm -f coverage.html
	rm -fr src-cov

.PHONY: test test-unit clean