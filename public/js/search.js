var app = new Vue({
  el: '#main',
  data: {
    profesores: [],
    nombres: '',
    // codigo: '',
  },
  created: function () {
    this.obtenerProfesores();
  },
  methods: {
    obtenerProfesores: function () {
      var urlUsers = 'https://fisitcsld.herokuapp.com/api/teachers';
      axios.get(urlUsers).then(response => {
        this.profesores = response.data
        console.log(this.profesores)
      });
    }
  },
  computed: {
    buscarDocente: function () {
      return this.profesores.filter((item) => 
        (item.nombres || '').includes(this.nombres)
      );
    }
  }
});