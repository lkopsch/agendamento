document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');
  var today = new Date();
  today.setHours(0, 0, 0, 0); // Define a hora para 00:00:00 para comparar apenas a data

  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 700,
    locale: 'pt-br',

    events: function(fetchInfo, successCallback, failureCallback) {
      var events = [];
      var requests = [];

      // Loop através de cada dia no intervalo exibido no calendário
      var currentDate = new Date(fetchInfo.start);
      currentDate.setHours(0, 0, 0, 0);

      while (currentDate <= fetchInfo.end) {
        (function(date) {
          var formattedDate = date.toISOString().split('T')[0];

          if (date < today) {
            // Adicionar evento de "Agenda Fechada" para dias passados
            events.push({
              title: 'Agenda Fechada',
              start: formattedDate,
              allDay: true,
              backgroundColor: '#b07b61',
              textColor: '#fff'
            });
          } else {
            // Requisição para verificar vagas em dias futuros
            let request = fetch(`/verificar_vagas/${formattedDate}/`)
              .then(response => response.json())
              .then(data => {
                var vagasDisponiveis = data.vagas_disponiveis;
                events.push({
                  title: vagasDisponiveis ? 'Há vagas' : 'Não há mais vagas',
                  start: formattedDate,
                  allDay: true,
                  backgroundColor: vagasDisponiveis ? 'green' : 'red',
                  textColor: '#fff'
                });
              })
              .catch(error => {
                console.error('Erro ao verificar vagas:', error);
              });

            requests.push(request); // Adiciona a promessa de requisição
          }
        })(new Date(currentDate)); // Captura o valor da data atual no loop

        currentDate.setDate(currentDate.getDate() + 1); // Próximo dia
      }

      // Quando todas as requisições estiverem completas
      Promise.all(requests).then(() => {
        successCallback(events); // Renderiza os eventos no calendário
      }).catch(failureCallback);
    },

    dateClick: function(info) {
      var selectedDate = info.dateStr;
      var eventTitle = info.dayEl.querySelector('.fc-event-title'); // Obtém o título do evento

      // Verifica se o dia é marcado como "Agenda Fechada"
      if (eventTitle && eventTitle.innerText === "Agenda Fechada") {
        alert("Este dia está fechado para agendamento.");
        return; // Impede ações para dias com "Agenda Fechada"
      }

      // Solicitação para verificar vagas na data clicada
      fetch(`/verificar_vagas/${selectedDate}/`)
        .then(response => response.json())
        .then(data => {
          if (!data.vagas_disponiveis) {
            alert("Não há vagas disponíveis neste dia.");
          } else {
            document.getElementById('selectedDate').innerText = selectedDate;

            // Manipula os botões de horário para a data selecionada
            var timeButtons = document.querySelectorAll('#timeButtons button');
            timeButtons.forEach(function(button) {
              button.classList.remove('disabled');
              button.setAttribute('data-date', selectedDate);
            });

            fetch(`/eventos-crus/?date=${selectedDate}`)
              .then(response => response.json())
              .then(data => {
                if (data.length > 0) {
                  data.forEach(event => {
                    var formattedTime = event.start_time.substring(0, 5);
                    var buttonToDisable = document.querySelector(`button[data-time="${formattedTime}"]`);
                    if (buttonToDisable) {
                      buttonToDisable.classList.add('disabled');
                    }
                  });
                }
              })
              .catch(error => {
                console.error('Erro ao buscar eventos:', error);
              });

            var modal = new bootstrap.Modal(document.getElementById('dateModal'));
            modal.show();
          }
        })
        .catch(error => {
          console.error('Erro ao verificar vagas:', error);
        });
    }
  });

  calendar.render();

  document.getElementById('btnMonthView').addEventListener('click', function() {
    calendar.changeView('dayGridMonth');
  });

  document.getElementById('btnWeekView').addEventListener('click', function() {
    calendar.changeView('timeGridWeek');
  });
});





// Adiciona o evento de clique aos botões de horário
document.querySelectorAll('#timeButtons button').forEach(function(button) {
  button.addEventListener('click', function() {
    // Coleta os dados do botão
    var date = this.getAttribute('data-date');
    var time = this.getAttribute('data-time');
    var eventTitle = 'Evento de ' + time + ' no dia ' + date;
  
    // Coleta os dados de nome e email do sessionStorage ou campos no DOM
    var name = sessionStorage.getItem('name') || document.getElementById('name').value;
    var email = sessionStorage.getItem('email') || document.getElementById('email').value;

    // Verifica se o nome e email estão presentes
    if (!name || !email) {
      alert('Nome e email são obrigatórios.');
      return;
    }

    // Cria um objeto com os dados do evento
    const newEvent = {
      title: eventTitle,
      start: `${date}T${time}:00`,
      allDay: false,
      name: name,
      email: email
    };

    // Envia o novo evento via POST para o Django
    fetch('/criar-evento/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')  // Token CSRF para segurança
      },
      body: JSON.stringify(newEvent)
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        alert('Evento adicionado com sucesso!');
        // Recarrega a página
        location.reload();
      } else {
         alert('Erro ao adicionar evento.');
      }
    })
    .catch(error => {
      console.error('Erro:', error);
    });
  });
});


// Função para obter o cookie CSRF
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Verifica se este cookie começa com o nome desejado
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}


