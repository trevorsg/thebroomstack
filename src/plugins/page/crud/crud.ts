import { FastifyPluginAsync } from "fastify";
import { Association, ModelCtor } from "sequelize/types";

export const CrudPlugin: FastifyPluginAsync = async (fastify, opts) => {
	fastify.get<{ Params: { model: string } }>(
		"/:model",
		async (request, reply) => {
			const model = fastify.sequelize.model(request.params.model);
			if (model) {
				const items = await model.findAll();
				const associations = getAssociations(model);
                Object.assign(reply.pageData?.data, {items, associations});
                return reply.renderTemplate();
			}
		}
	);
};

type SerializableAssociation = Omit<
	Association,
	"source" | "target" | "inspect"
> & { through?: string };

function getAssociations(model: ModelCtor<any>) {
	const associations: SerializableAssociation[] = [];
	for (const assoc of Object.values(model.associations)) {
		const serializable: SerializableAssociation = {
			as: assoc.as,
			associationType: assoc.associationType,
			isSelfAssociation: assoc.isSelfAssociation,
			isSingleAssociation: assoc.isSingleAssociation,
			isMultiAssociation: assoc.isMultiAssociation,
			isAliased: assoc.isAliased,
			foreignKey: assoc.foreignKey,
			identifier: assoc.identifier,
		};
		const joinTableName: string | undefined = (assoc as any)[
			"combinedName"
		];
		if (joinTableName) {
			serializable.through = joinTableName;
		}

		associations.push(serializable);
	}
	return associations;
}