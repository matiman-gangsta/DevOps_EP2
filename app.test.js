const request = require('supertest');
const { app, server } = require('./app');

afterAll(() => {
  server.close();
});

describe('Pruebas Unitarias del Microservicio - Student Base', () => {
  
  it('Debería responder 200 OK en el endpoint de Health Check', async () => {
    const res = await request(app).get('/health');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toEqual('UP');
  });

});