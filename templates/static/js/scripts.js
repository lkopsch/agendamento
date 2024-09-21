document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');
  var today = new Date();

  var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 700,
      locale: 'pt-br',
      validRange: {
          start: today
      },
      events: function(fetchInfo, successCallback, failureCallback) {
          fetch('/eventos/')
              .then(response => response.json())
              .then(data => {
                  var formattedEvents = data.map(event => {
                      // Se o usuário não for superuser ou staff, esconde o título do evento
                      if (!isSuperuserOrStaff) {
                          return {
                              ...event,
                              title: ''  // Esconde o título
                          };
                      }
                      return event;  // Mantém o evento completo
                  });

                  successCallback(formattedEvents);
              })
              .catch(error => {
                  console.error('Erro ao buscar eventos:', error);
                  failureCallback(error);
              });
      },

      dateClick: function(info) {
          var selectedDate = info.dateStr;
          document.getElementById('selectedDate').innerText = selectedDate;
          console.log("Data selecionada:", selectedDate);

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
                          var formattedTime = event.start_time.substring(0, 5);  // Pega apenas HH:MM
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


