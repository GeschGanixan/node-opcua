"use strict";
/* global describe,it,before*/

const should = require("should");

const _ = require("underscore");

const get_mini_address_space = require("../test_helpers/get_mini_address_space").get_mini_address_space;

const browse_service = require("node-opcua-service-browse");
const BrowseDirection = require("node-opcua-data-model").BrowseDirection;

const describe = require("node-opcua-leak-detector").describeWithLeakDetector;

describe("testing add new ObjectType ", function () {

    let addressSpace;

    before(function (done) {
        get_mini_address_space(function (err,__addressSpace__) {
            addressSpace = __addressSpace__;
            done(err);
        });
    });
    after(function () {
        addressSpace.dispose();
        addressSpace = null;
    });

    it("should instantiate a objectType that uses custom HasChild Property",function() {

        const namespace =addressSpace.getOwnNamespace();
        // ------------ Add a new aggregate
        const weezbeChildType = namespace.addReferenceType({
            browseName: "HasWeezbe",
            inverseName: "WeezbeOf",
            isAbstract: false,
            subtypeOf: "Aggregates"
        });

        const myObjectType = namespace.addObjectType({
            browseName: "MyObjectType"
        });

        const weezbeChild = namespace.addObject({
            browseName:    "MyWeezBe",
            modellingRule:"Mandatory"
        });

        myObjectType.addReference({
            referenceType: weezbeChildType.nodeId, nodeId: weezbeChild
        });

        let aggregates = myObjectType.getAggregates();
        //xx console.log("myObjectType aggregates=  ",aggregates.map(function(c){ return c.browseName.toString(); }).join(" "));
        aggregates.length.should.eql(1);


        const instance= myObjectType.instantiate({
            browseName: "Instance"
        });
        instance.browseName.toString().should.eql("1:Instance");

         aggregates = instance.getAggregates();
        //xx console.log("equipmentType children=  ",aggregates.map(function(c){ return c.browseName.toString(); }).join(" "));
        aggregates.length.should.eql(1);


        instance.findReferencesEx("1:HasWeezbe",BrowseDirection.Forward).length.should.eql(1);

        const c = instance.getChildByName("MyWeezBe");
        should.exist(c);

    });


    it("should be possible to choose which optional item to instantiate in sub objects",function() {
        const namespace =addressSpace.getOwnNamespace();

        function constructObjectType() {

            const mySubObjectType1 = namespace.addObjectType({
                browseName: "MySubObjectType1"
            });
            const prop1 = namespace.addVariable({
                propertyOf: mySubObjectType1,
                browseName: "Property1",
                dataType: "Double",
                modellingRule: "Mandatory"
            });

            mySubObjectType1.property1.browseName.toString().should.eql("1:Property1");

            const prop2 = namespace.addVariable({
                propertyOf: mySubObjectType1,
                browseName: "Property2",
                dataType: "Double",
                modellingRule: "Optional"
            });
            const prop3 = namespace.addVariable({
                propertyOf: mySubObjectType1,
                browseName: "Property3",
                dataType: "Double",
                modellingRule: "Optional"
            });

            const myObjectType1 = namespace.addObjectType({
                browseName: "MyObjectType1"
            });

            const subObj = mySubObjectType1.instantiate({
                browseName: "SubObj",
                modellingRule: "Optional",
                componentOf: myObjectType1,
                optionals: ["Property2", "Property3"]
            });

            myObjectType1.getComponentByName("SubObj").browseName.toString().should.eql("1:SubObj");
            myObjectType1.subObj.getPropertyByName("Property1").browseName.toString().should.eql("1:Property1");
            myObjectType1.subObj.getPropertyByName("Property2").browseName.toString().should.eql("1:Property2");
            myObjectType1.subObj.getPropertyByName("Property3").browseName.toString().should.eql("1:Property3");

        }
        constructObjectType();

        const myObjectType1 = addressSpace.findObjectType("1:MyObjectType1");

        // -----------------------------------------------
        const obj1 = myObjectType1.instantiate({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "Obj1"
        });
        should(obj1.getComponentByName("SubObj")).eql(null);


        // -----------------------------------------------
        const obj2 = myObjectType1.instantiate({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "Obj2",
            optionals: ["SubObj"]
        });
        should.exist(obj2.getComponentByName("SubObj"));
        obj2.getComponentByName("SubObj").browseName.toString().should.eql("1:SubObj");

        should.exist(obj2.subObj.getPropertyByName("Property1"));
        should.not.exist(obj2.subObj.getPropertyByName("Property2"));
        should.not.exist(obj2.subObj.getPropertyByName("Property3"));

        // -----------------------------------------------
        const obj3 = myObjectType1.instantiate({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "Obj3",
            optionals: [
                "SubObj.Property2",
                "SubObj.Property3"
            ]
        });
        obj3.getComponentByName("SubObj").browseName.toString().should.eql("1:SubObj");

        should.exist(obj3.subObj.getPropertyByName("Property1"));
        should.exist(obj3.subObj.getPropertyByName("Property2"));
        should.exist(obj3.subObj.getPropertyByName("Property3"));

        // -----------------------------------------------
        const obj4 = myObjectType1.instantiate({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "Obj4",
            optionals: [
                "SubObj.Property3"
            ]
        });
        obj4.getComponentByName("SubObj").browseName.toString().should.eql("1:SubObj");

        should.exist(obj4.subObj.getPropertyByName("Property1"));
        should.not.exist(obj4.subObj.getPropertyByName("Property2"));
        should.exist(obj4.subObj.getPropertyByName("Property3"));
    });

});
