# Credenciais do consultório de teste (seed). Sem senhas em .env — só uso local de aceite.

$script:TestUsers = @{
  Owner     = @{ Email = 'owner@teste.local'; Password = 'SenhaForte!99'; Name = 'Owner Teste' }
  Reception = @{ Email = 'recepcao@teste.local'; Password = 'SenhaForte!99'; Name = 'Carla Recepção' }
  Finance   = @{ Email = 'financeiro@teste.local'; Password = 'SenhaForte!99'; Name = 'Financeiro Teste' }
  Dentist   = @{ Email = 'dentist@teste.local'; Password = 'SenhaForte!99'; Name = 'Dra. Ana Souza' }
  Assistant = @{ Email = 'asb@teste.local'; Password = 'SenhaForte!99'; Name = 'ASB Teste' }
}

$script:SeedPatient = 'Maria Silva'
$script:SeedClinic = 'Clínica Teste'
