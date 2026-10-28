pm.test('Public liveness endpoint responds successfully', () => pm.response.to.have.status(200));
pm.test('Stable public response without internal details', () => {
  pm.expect(pm.response.json()).to.eql({ status: 'ok', service: 'bitmax-api', version: '1.0.0' });
});
pm.test('Health responses are not cached', () => pm.expect(pm.response.headers.get('Cache-Control')).to.eql('no-store'));
