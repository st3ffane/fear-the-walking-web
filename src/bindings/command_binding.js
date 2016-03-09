//--require property_binding

/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

  
  command_binding.js:

*/
/*binding d'une commande*/
function __command_binding(infos){

    __prop_binding.call(this, infos);
    
    //NOTE: si crée un element a partir d'un model????
    /*if (this._element){
            proto = new CommandBindingElement();
            proto.__proto__ = this._element.__proto__;
            this._element.__proto__ = proto;
    }*/
    var bind = this;
    this.__process_event = function(evt){
        
        if (bind.context == null) return;
        
        
        //recupere le nom de la methode
        var value = bind.command;
        if(value == null) value = bind.fallback;
        value = bind.convert_value (value, bind.context);
        var params = null;
        //appel a la methode, passe les données
        if (bind.command_params!=null){
            params=[];


            for (cpi=0;cpi<bind.command_params.length;cpi++){
                if (bind.command_params[cpi][0]=="$"){
                    //recupere le nom de la prop
                    var prop = bind.command_params[cpi].substr(1);

                    if (prop in bind.context) params.push(bind.context[prop]);//par valeur
                    else params.push('null');
                }
                else params.push(bind.command_params[cpi]);
            }

        }
        
        
        CONTEXT[value](evt,params);
    }
    
    
    infos.from = this.from = "COMMANDS";

    this.context = null;
    this.command = infos.command; 	//la methode du context de données global a executer
    this._cmd_parameters = null;    //des parametres pour la methode
	
    this.command_params =  infos.command_params;

}
//le prototype...
var cb_pr = {
        get command_params(){return this._cmd_parameters;},
        set command_params(value){
                if (value==null) this._cmd_parameters = null;
                //split la chaine en un tableau de parametres
                else if (value[0]=='[' && value[value.length-1]==']'){
                        //un tableau de parametres
                        value = value.substring(1, value.length-2);
                        this._cmd_parameters = [];
                        var cmds = value.split(',');
                        var cmd_length = cmds.length;
                        
                        for (var p=0;p<cmd_length;p++){
                            this._cmd_parameters.push(cmds[p]);
                        }
                }

                else {
                        this._cmd_parameters = [value];
                }
        }
};
cb_pr.__proto__ = new __prop_binding(  );
__command_binding.prototype =cb_pr;


//initialise la commande
	//@param ctx: le context de donnée
__command_binding.prototype.init = function(ctx){
        
        this.context=ctx;
        if (this.command != null && this.to!=null){
                

            this._element.addEventListener(this.to,this.__process_event);
            //addCommandListener(this._element, this.to,this.__process_event);
            //this._element._cmd_binding = this;                                                                                  // memory leaks?????? TODO
        }
};
__command_binding.prototype.populate = function (value, context, extra){
        //this.init(context);
};
__command_binding.prototype._clean = function(){
        //supprime le listener
        this._element.removeEventListener(this.to,this.__process_event );
        this.context = null;
}
    
    
    