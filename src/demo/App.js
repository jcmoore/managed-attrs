import React from "react";
import { useManagedAttrs, reducerPipeline } from "../lib/react";
import { ValueInput, EntryList, asTable } from "./components";

const produce = fn => fn;

const Example1 = () => {
  const [attrs, manageAttrs] = useManagedAttrs({
    listAttrs: {
      items: [
        { key: "won", text: "won", children: "won" },
        { key: "too", text: "too", children: "too" },
        { key: "for", text: "for", children: "for" },
        { key: "ate", text: "ate", children: "ate" }
      ]
    }
  });

  return <EntryList {...attrs} emitter={manageAttrs} />;
};

const Example2 = () => {
  const [attrs, manageAttrs] = useManagedAttrs({ value: "optional" });

  return <ValueInput {...attrs} emitter={manageAttrs} />;
};

const Example3 = () => {
  const [attrs, manageAttrs, spreadAttrs] = useManagedAttrs({ value: "..." });

  return (
    <div>
      <button onClick={() => spreadAttrs({ value: "" })}>Clear</button>
      <ValueInput {...attrs} emitter={manageAttrs} />
      <span>{attrs.value}</span>
    </div>
  );
};

const Example4 = () => {
  const [attrs, manageAttrs] = useManagedAttrs({
    top: { value: "text" },
    bottom: { value: "txet" }
  });

  return (
    <div>
      <ValueInput KEY="top" {...attrs.top} emitChange={publishChange} />
      <ValueInput
        KEY="bottom"
        {...attrs.bottom}
        emitChange={publishChange}
        // emitter={}
        nodeProps={{
          style: { textAlign: "right" }
        }}
      />
    </div>
  );

  function publishChange(action, reducer) {
    manageAttrs(
      action,
      // export const bindChange = (action, reducer) => // test me
      produce(
        reducerPipeline(
          state => {
            const { key } = action;
            switch (key) {
              case "top":
              case "bottom":
                return { ...state, [key]: reducer(state[key], action) };
              default:
                return state;
            }
          },
          state => {
            const value = [...state.top.value].reverse().join("");

            return action.key === "top" && state.bottom.value !== value
              ? { ...state, bottom: { ...state.bottom, value } }
              : state;
          },
          state => {
            const value = [...state.bottom.value].reverse().join("");

            return action.key === "bottom" && state.top.value !== value
              ? { ...state, top: { ...state.top, value } }
              : state;
          }
        )
      )
    );
  }
};

const App = () => {
  const [attrs, manageAttrs] = useManagedAttrs({});

  return (
    <div>
      <h1>Example 1</h1>
      <Example1 />

      <h1>Example 2</h1>
      <Example2 />

      <h1>Example 3</h1>
      <Example3 />

      <h1>Example 4</h1>
      <Example4 />

      <h1>Example 5</h1>
      <button onClick={handleClick}>Remove Selected Items</button>
      <br />
      <br />
      <EntryList
        {...attrs}
        emitItemAdd={publishItemAdd}
        emitter={manageAttrs}
        inputAttrs={{
          ...attrs.inputAttrs,
          nodeProps: {
            placeholder: "Enter new list item...",
            style: { width: "100%" }
          }
        }}
        nodeProps={{
          style: { border: "1px solid black" }
        }}
      />
    </div>
  );

  function collate({ text: left }, { text: right }) {
    return left.toLowerCase().localeCompare(right.toLowerCase());
  }

  function publishItemAdd(action, reducer) {
    manageAttrs(
      action,
      // export const bindItemAdd = (action, reducer) => // test me
      produce(
        reducerPipeline(reducer, state => {
          const last = state.listAttrs && state.listAttrs.items;
          const items = last ? last.slice().sort(collate) : last;

          return items === last
            ? state
            : { ...state, listAttrs: { ...state.listAttrs, items } };
        })
      )
    );
  }

  function handleClick({ ...event }) {
    manageAttrs(
      { event, type: "emitFilterClick", key: undefined },
      // export const reduceClick = // test me
      produce(state => {
        const { listAttrs = {} } = state;
        const { selected } = listAttrs.itemPropTable || {};
        const fields = Object.keys(listAttrs.itemPropTable || {});

        const last = asTable(listAttrs.itemPropTable);
        let table = last;

        const items =
          listAttrs.items &&
          listAttrs.items.filter(({ key }) => {
            if (!selected || !selected.get(key)) {
              return true;
            }

            for (let at = 0; at < fields.length; at += 1) {
              const name = fields[at];
              let column = table[name];

              if (table[name]) {
                const update = column === last[name] && column.has(key);
                column = update ? new Map(column) : column;
                column.delete(key);

                table = column === table[name] ? table : { ...table };
                table[name] = column;
              }
            }

            return false;
          });

        return table === last
          ? state
          : {
              ...state,
              listAttrs: { ...listAttrs, items, itemPropTable: table }
            };
      })
    );
  }
};

export default App;
