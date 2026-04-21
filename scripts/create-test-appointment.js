const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oblhpautwsgqalcaoquz.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibGhwYXV0d3NncWFsY2FvcXV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxMTQ4MiwiZXhwIjoyMDg3ODg3NDgyfQ.vp55AhyRAcp0uWuH9V3i9zUIQ9Dj4wZ9sMaxEcMM03w';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function findEmployeeByName(namePart) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .ilike('name', `%${namePart}%`)
    .limit(5);

  if (error) {
    console.error('Error finding employee:', error);
    return null;
  }
  return data;
}

async function findServices(orgId) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('organization_id', orgId)
    .eq('active', true)
    .limit(10);

  if (error) {
    console.error('Error finding services:', error);
    return null;
  }
  return data;
}

async function findClients(orgId) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', orgId)
    .limit(10);

  if (error) {
    console.error('Error finding clients:', error);
    return null;
  }
  return data;
}

async function getOrganizationId() {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(5);

  if (error) {
    console.error('Error finding organizations:', error);
    return null;
  }
  return data;
}

async function createTestAppointment(orgId, employeeId, clientId, serviceId, startTime) {
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const { data: apt, error: aptError } = await supabase
    .from('appointments')
    .insert({
      organization_id: orgId,
      client_id: clientId,
      employee_id: employeeId,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      status: 'confirmed',
      notes: 'Cita de prueba creada por script',
    })
    .select('id')
    .single();

  if (aptError) {
    console.error('Error creating appointment:', aptError);
    return null;
  }

  const { error: relationError } = await supabase
    .from('appointment_services')
    .insert({
      appointment_id: apt.id,
      service_id: serviceId,
    });

  if (relationError) {
    console.error('Error creating appointment_service relation:', relationError);
  }

  return apt;
}

async function main() {
  console.log('=== Finding Organization ===');
  const orgs = await getOrganizationId();
  if (!orgs || orgs.length === 0) {
    console.log('No organizations found');
    return;
  }
  console.log('Organizations:', orgs.map(o => `${o.id} - ${o.name}`).join('\n'));
  const orgId = orgs[0].id;

  console.log('\n=== Finding Employee (Alejandra) ===');
  const employees = await findEmployeeByName('Alejandra');
  if (!employees || employees.length === 0) {
    console.log('No employees found with "Alejandra"');
    return;
  }
  console.log('Employees found:', employees.map(e => `${e.id} - ${e.name}`).join('\n'));
  const employee = employees[0];

  console.log('\n=== Finding Services ===');
  const services = await findServices(orgId);
  if (!services || services.length === 0) {
    console.log('No services found');
    return;
  }
  console.log('Services:', services.map(s => `${s.id} - ${s.name} (${s.duration} min, $${s.price})`).join('\n'));
  const service = services[0];

  console.log('\n=== Finding Clients ===');
  const clients = await findClients(orgId);
  if (!clients || clients.length === 0) {
    console.log('No clients found');
    return;
  }
  console.log('Clients:', clients.map(c => `${c.id} - ${c.name} (${c.phone || 'no phone'})`).join('\n'));
  const client = clients[0];

  console.log('\n=== Creating Test Appointment ===');
  const today = new Date();
  today.setHours(18, 30, 0, 0);

  const appointment = await createTestAppointment(
    orgId,
    employee.id,
    client.id,
    service.id,
    today.toISOString()
  );

  if (appointment) {
    console.log('\n✅ Appointment created successfully!');
    console.log(`   ID: ${appointment.id}`);
    console.log(`   Employee: ${employee.name}`);
    console.log(`   Client: ${client.name}`);
    console.log(`   Service: ${service.name}`);
    console.log(`   Time: ${today.toISOString()}`);
  }
}

main().catch(console.error);